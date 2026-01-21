---
title: "Autonomous Verification: Demo Videos as Proof of Work"
date: "2026-01-18"
description: "Multi-agent orchestration for generating demo videos that prove Claude's work actually works"
slug: "demo-creator"
---

*The demo-creator plugin is [available on GitHub](https://github.com/estsauver/demo-creator/tree/main).*

## The supervision tax

The previous post was about running Claude sessions in parallel. Worktrees for isolated code, Kubernetes for isolated environments. You can have five Claudes working on five features without them stepping on each other.

But parallel execution surfaces a new bottleneck: verification. Each session finishes and needs review. Did it actually work? I read the diff. I run it locally. I squint at test output. Then I context-switch to the next session and do it again. Like Claude after `/clear`, it takes a minute to reload context once my brain has been wiped by switching worktrees.

I ask Claude for tests, and it writes them. But it struggles with integration tests that exercise the system the way a user poking around and trying to break things does. I've had cases where an integration test covers just the minimum required for something to work on the page, but everything else is broken. Or the test passes but the frontend won't render. Obviously unacceptable from the perspective of shipping software.

Poking at a system is still required to actually test it. But if we want to keep running Claude sessions in parallel, we have to figure out how to automate that poking.

If verification takes 15 minutes and I have four sessions running, I'm spending an hour just checking work. The throughput gain from parallel Claude gets eaten by serial verification.

```visualization:verification-bottleneck
```

What I wanted was async verification. Claude produces an artifact that proves it worked. Not "trust me, the tests pass" but something I can look at and immediately understand.

A demo was what I needed. Any software engineer who's been reluctantly forced into product management by Claude eating their job will recognize the request: "Show me it working. I want to see it actually working." Ninety seconds of the feature in action. Not a screen recording I have to make, but one that Claude makes as proof of its own work.

At its core, this is why a lot of tech companies have demos. The demo's hard to fake. You have to actually click through this thing, show it's working, prove that you built what you said you built, and that it's usable. It forces integration thinking in a way that unit tests don't.

What if demos cost $0.15 and ten minutes of Claude's time, not yours? Then you could make them everywhere. They become a trivial part of every workflow. Claude finishes a feature, generates a narrated video proving it works, uploads it, gives you a link. The demo becomes the integration test you can actually watch.

## Previously: parallel environments

Quick recap from [the last post](/blog/claude-code-workflow). We use git worktrees for parallel branches, each in its own directory. Each worktree gets a Kubernetes namespace with isolated services: frontend, backend, workers, its own database. Traefik routes `feature-branch.localhost` to the right namespace.

```visualization:namespace-architecture
```

This solved the "Claude sessions stepping on each other" problem. But it didn't solve verification. Isolated environments are infrastructure for doing. You still need infrastructure for knowing it worked.

## Demos as proof

Tests prove the code does what the test says. They don't prove the feature works when a human uses it. You can have 847 passing tests and a broken user flow. The gaps between test coverage and real usage are where bugs hide.

Demos are harder to fake. You have to actually click through the thing. Navigate the UI. Show the data flowing. If something is broken in a way the tests missed, the demo reveals it. This is why sprint reviews exist - the demo is proof you built what you said you built.

The difference isn't just communication, though demos do communicate better than test output. It's that demos force a level of integration that tests often skip. You can mock your way through a test suite. You can't mock your way through a screen recording.

```visualization:tests-vs-demos
```

The demo-creator pipeline takes a feature description and produces a narrated video:

```
/demo-creator "drug search filtering"
```

Ten minutes later, you have a link to a 90-second video. The video shows the feature. The narration explains what's happening. It's uploaded to cloud storage, ready to drop into a PR or Slack.

The cost breakdown:

- ElevenLabs TTS: roughly $0.10-0.15
- Cloud storage: about $0.01/month
- Kubernetes job: negligible
- Your time: zero

Not every feature is a UI feature. For CLI tools, APIs, or test suites, the system has a second mode: terminal demos. Instead of Playwright and video, it uses a YAML schema to declare commands and outputs asciinema recordings or GIFs.

```yaml
steps:
  - action: run
    content: "pytest tests/ -v"
    narration:
      before: "Running the test suite"
      after: "All tests passed"

  - action: run
    content: "curl -X POST localhost:8000/api/drugs/search -d '{...}'"
    narration:
      after: "The API returns filtered results"
```

Same principle: Claude writes the script, the system records and narrates it, you get a shareable artifact. The browser pipeline produces MP4s for UI features. The terminal pipeline produces `.cast` files or GIFs for everything else.

## Why multi-agent? The context problem

You can't do this in a single Claude session.

The task spans too many domains: analyzing git history, writing Playwright scripts, understanding browser selectors, generating narration, calling text-to-speech APIs, video compositing, cloud uploads. By the time you reach the video editing step, the context is stuffed with Playwright documentation and the model has forgotten what the feature was supposed to do.

There's also the focus problem. A prompt that says "analyze the code, write a script, validate it, record it, narrate it, composite it, and upload it" produces worse results than nine prompts that each say "do this one thing well."

The solution is decomposition. Nine specialized agents, each with a bounded mission:

1. Rough outline: analyze the git diff, interview the user, produce a scene breakdown
2. Detailed script: write Playwright automation from the outline
3. Validation: dry-run the script, catch selector issues early
4. Recording: execute in a K8s job, capture video
5. Narration: write the voiceover script with timestamps
6. Adjustment: human checkpoint to review and edit narration
7. Audio: call ElevenLabs, generate speech
8. Compositing: merge video and audio with ffmpeg
9. Upload: push to GCS, generate a shareable URL

```visualization:pipeline-overview
```

Each agent starts fresh. Clean context. One job. When it finishes, it writes its outputs to the filesystem where the next agent can find them.

## The nine-stage pipeline

The pipeline is nine Claude Code sub-agents, each with its own prompt file. The parent orchestrator spawns them in sequence, passing context through the manifest. Here's what the output directory looks like after a successful run:

```bash
.demo/FIB-123-drug-search/
├── manifest.json           # Pipeline state
├── outline.md              # Stage 1 output
├── script.py               # Stage 2 output
├── validation_report.json  # Stage 3 output
├── demo_recording.webm     # Stage 4 output
├── narration_script.txt    # Stage 5 output
├── narration_audio.mp3     # Stage 7 output
├── demo_final.mp4          # Stage 8 output
└── summary.json            # Stage 9 output
```

**Stage 1: Outline.** The first agent reads your git diff, looks at recent commits, and asks clarifying questions. It outputs `outline.md` with scene descriptions and setup requirements:

```markdown
# Demo Outline: Drug Search Filtering

## Setup Requirements
- Seed database: kubectl exec -n worktree-demo-agents ...

## Demo Flow

### Scene 1: Navigate to Feature
**Duration:** ~10 seconds
**Actions:** User navigates to /drugs page

### Scene 2: Apply Filters
**Duration:** ~25 seconds
**Actions:** User clicks Filter, enters "EGFR", submits
```

**Stage 2: Script.** The second agent converts that outline into executable Playwright:

```python
def run_demo(page):
    # Scene 1: Navigate to Feature
    page.goto("http://demo-agents.localhost/drugs")
    page.wait_for_load_state("networkidle")
    time.sleep(2)

    # Scene 2: Apply Filters
    page.click('button:has-text("Filter")')
    page.fill('input[name="target_filter"]', "EGFR")
    page.click('button[type="submit"]')
    time.sleep(1.5)
```

**Stage 3: Validate.** The agent dry-runs the script without recording. This catches selector issues early, before you spend money on recording and TTS. If a button moved or a class name changed, you find out here with screenshots showing what the page actually looks like.

**Stage 4: Record.** The validated script runs inside a Kubernetes job with Playwright's video capture enabled:

```python
context = browser.new_context(
    viewport={"width": 1920, "height": 1080},
    record_video_dir="./recordings",
    record_video_size={"width": 1920, "height": 1080}
)
```

**Stage 5: Narration.** The agent parses `time.sleep()` calls to build a timing map, then writes voiceover text with timestamps:

```
[00:00:00.000] Welcome to our drug search interface.
[00:00:10.500] Let's filter by target and development stage.
[00:00:25.000] Here we see the filtered results.
```

**Stage 6: Review.** The human checkpoint. The agent shows you the narration and asks if you want to edit anything before the expensive TTS step. This is the one place where the pipeline explicitly waits for input.

**Stage 7: Audio.** ElevenLabs converts each segment to speech, then concatenates with precise timing:

```python
client = ElevenLabsClient(voice_id="TxGEqnHWrfWFTfGW9XjX")

for segment in narration_segments:
    client.generate_audio(
        text=segment['text'],
        output_path=f"segment_{segment['id']:03d}.mp3"
    )
```

**Stage 8: Composite.** Merge video and audio with moviepy:

```python
video = VideoFileClip("demo_recording.webm")
narration = AudioFileClip("narration_audio.mp3")

final = video.set_audio(narration)
final.write_videofile("demo_final.mp4", codec="libx264")
```

**Stage 9: Upload.** Push to GCS with metadata, generate a shareable URL, write the summary JSON.

The key insight is that each agent is stateless. It reads from files, does its job, writes to files, and exits. No agent needs to remember what the previous one did. That's what the filesystem is for.

## The manifest pattern

Agents don't share context. They share a contract.

The `manifest.json` file is the coordination mechanism. It tracks which stages have run, what they produced, and what failed. Each agent reads the manifest to understand where things stand, does its work, updates the manifest, and exits.

```python
class Manifest:
    def __init__(self, demo_id: str):
        self.demo_id = demo_id
        self.demo_dir = Path(".demo") / demo_id
        self.manifest_path = self.demo_dir / "manifest.json"

    def complete_stage(self, stage: int, outputs: Dict[str, Any]) -> None:
        data = self.data
        if stage not in data["completed_stages"]:
            data["completed_stages"].append(stage)
        data["stage_outputs"][str(stage)] = outputs
        self._save()

    def fail_stage(self, stage: int, error_type: str,
                   error_message: str, suggested_fix: str = None) -> None:
        data = self.data
        data["failed_stages"].append(stage)
        data["errors"].append({
            "stage": stage,
            "error_type": error_type,
            "error_message": error_message,
            "suggested_fix": suggested_fix,
            "timestamp": datetime.utcnow().isoformat()
        })
        self._save()
```

A manifest looks like this:

```json
{
  "demo_id": "FIB-123-drug-search",
  "linear_issue": "FIB-123",
  "git_sha": "a1b2c3d",
  "git_branch": "earl/fib-123-drug-search",
  "current_stage": 5,
  "completed_stages": [1, 2, 3, 4],
  "failed_stages": [],
  "stage_outputs": {
    "1": {"outline_path": "outline.md"},
    "2": {"script_path": "script.py"},
    "3": {"validation_status": "passed"},
    "4": {"video_path": "demo_recording.webm", "duration_seconds": 94}
  },
  "errors": []
}
```

```visualization:manifest-sharing
```

This is content hiding. The narration agent doesn't need to know how recording works. It just reads `stage_outputs["4"]["duration_seconds"]` to know how long the video is. The compositing agent doesn't care about git history. It just needs paths to the video and audio files.

Each agent sees precisely what it needs. No more, no less.

## Checkpointing and resume

Complex pipelines fail. Networks timeout. APIs rate-limit. Claude's context fills up mid-task. If you can't recover, you start over. That's expensive when you've already paid for recording and TTS.

The manifest makes the pipeline resumable. Each stage writes its status before exiting. If something fails at stage 7, you don't re-run stages 1-6. You fix the issue and resume from 7.

```python
def get_or_create_manifest(demo_id: str, **kwargs) -> Manifest:
    manifest = Manifest(demo_id)
    if manifest.manifest_path.exists():
        manifest.load()  # Resume existing pipeline
    else:
        manifest.initialize(**kwargs)  # Start fresh
    return manifest
```

The orchestrator checks which stages are complete:

```python
manifest = get_or_create_manifest("FIB-123-drug-search")

for stage in range(1, 10):
    if manifest.is_stage_completed(stage):
        continue  # Skip completed stages

    # Spawn the appropriate sub-agent
    run_stage_agent(stage, manifest)
```

When a stage fails, it records why:

```json
{
  "errors": [{
    "stage": 3,
    "error_type": "ElementNotFound",
    "error_message": "Selector 'button.submit' not found",
    "suggested_fix": "Check validation_screenshots/error_scene_2.png",
    "timestamp": "2025-01-18T10:23:45Z"
  }]
}
```

The next run sees the error, knows where to look, and can attempt recovery. This is especially useful for the validation stage. If selectors are wrong, you get screenshots showing what the page actually looks like.

```visualization:checkpoint-resume
```

## Same infrastructure, different workload

The recording stage runs in a Kubernetes job using [screenenv](https://github.com/huggingface/screenenv), Hugging Face's headless browser environment. This is the same infrastructure from the previous post, repurposed.

Why not record locally? You don't need a display. The K8s job runs headless Chromium without a monitor or X server. You get clean state every time, with no cached logins, no browser extensions, no leftover cookies from your last debugging session. And you get isolation. The recording job can't interfere with your local environment. It runs in its own pod, its own network namespace, accessing the app through the cluster's internal routing.

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: screenenv-{{ .Values.demoId }}
spec:
  template:
    spec:
      containers:
        - name: recorder
          image: mcr.microsoft.com/playwright:v1.40.0
          command: ["python", "script.py"]
          volumeMounts:
            - name: demo-volume
              mountPath: /demo
      restartPolicy: Never
  ttlSecondsAfterFinished: 600
```

The job mounts the demo directory, runs the Playwright script, writes the recording, and exits. The `ttlSecondsAfterFinished` cleans it up automatically.

Eventually, I want demos generated automatically for every PR. Not a priority yet, but the infrastructure is there. CI triggers the pipeline, the demo uploads to GCS, the PR description gets a video link. Every feature ships with proof it works.

```visualization:k8s-cluster-workloads
```

## Where videos travel

The video doesn't stop at "here's your file." It goes places.

It goes into pull requests. Reviewers watch 90 seconds instead of reading 500 lines of diff. They see the feature, not the implementation.

```markdown
## Summary
Added filtering to drug search results by target and stage.

## Demo
https://storage.googleapis.com/fibonacci-demos/FIB-123-drug-search.mp4
```

It goes into Slack. It goes into Linear. It goes into onboarding docs. The pipeline also generates captions, so the videos work without sound.

```visualization:video-destinations
```

The upload stage handles all of this. It pushes to GCS, sets metadata (demo_id, git SHA, duration), and generates either a public URL or a signed URL with expiry. The summary includes everything:

```json
{
  "demo_id": "FIB-123-drug-search",
  "video_url": "https://storage.googleapis.com/fibonacci-demos/FIB-123-drug-search.mp4",
  "duration_seconds": 94,
  "git_sha": "a1b2c3d",
  "created_at": "2025-01-18T10:30:00Z"
}
```

## The unlock: optional supervision

Here's what this enables:

1. Give Claude a Linear ticket
2. Claude implements the feature
3. Claude generates a demo proving it works
4. You watch a 90-second video
5. If it looks right, you ship it

The verification step moved from synchronous to async. You don't have to check out the branch, run the app, click through the flow. You watch a video when you have time.

This changes the economics of parallel Claude sessions. In the previous post, I described running multiple Claudes on multiple features. The bottleneck was verification. Each session needed my attention to confirm the work was correct.

With demo-creator, verification becomes "watch this video." Four Claude sessions producing four features means four videos to review. That's 6 minutes of watching instead of an hour of context-switching and manual testing.

The supervision tax drops. Autonomy becomes practical.

```visualization:async-verification
```

## Platform team for your Claudes

The pattern is the same as the previous post. We're building layers of infrastructure to address the areas where Claude is weak.

The `wt` script handled parallel work. Isolated environments so sessions don't step on each other. The demo-creator handles verification, acting like a QA engineer in a limited sense. It gives us another layer of protection as we try to ship things faster.

---

## About the plugin

I extracted demo-creator from our main monorepo and [published it on GitHub](https://github.com/estsauver/demo-creator/tree/main). The core idea is to force Claude into something closer to integration testing by making it demonstrate that things actually work end-to-end.

A caveat: this isn't a polished, drop-in solution. I pulled it out of my codebase and removed some things tied to how it was integrated into my development environment. For example, we use Kubernetes to host the screenenv container that runs the Playwright tests. You'll need to run it locally or adapt it to your setup.

It works well for me, but there might be adaptation required for your environment. The value I've gotten from it is real though - more often than not, you end up with a 30-second to one-minute video that shows how Claude thinks the feature should work. And when Claude cheats (it will if it feels like it needs to), at least you have video evidence of what actually happened.
