---
title: "Getting Real Leverage from Claude Code"
date: "2025-01-13"
description: "Running multiple Claude Code sessions in parallel, each in its own fully isolated environment"
slug: "claude-code-workflow"
---

Most AI coding content focuses on the wow moments—the first draft, the speed, the magic. But I've found the real leverage comes from solving the boring problems: how do you actually run multiple Claude sessions without them stepping on each other? How do you give each one a real environment to work in?

It's less about "AI writes my code"—it's been writing my code for a while—and more about setting up a dev environment with great isolation. I used to avoid this because it was a multi-day yak-shave. Now I have it, because Claude can write Helm charts while I focus on the actual problem.

This post is about running multiple Claude Code sessions in parallel, each in its own fully isolated environment. It required solving real infrastructure problems, and the interesting part is that solving them became tractable when I could hand the tedious parts to Claude.

I will cover git worktrees for parallel branches, why worktrees alone fail (shared ports, shared databases, chaos), Kubernetes for local dev (yes, really), Traefik and observability so you are not playing "which pod is which", and the database question, the one thing I still do not have a perfect answer for.

The takeaway is not "use these exact tools." It is that there is a category of infrastructure, stuff that is clearly valuable but historically not worth the setup cost, that becomes worth doing when someone else handles the YAML. There is great leverage in AI writing your business logic, but your team of Claudes also needs a platform team. Someone has to build the scaffolding that lets them work in parallel without stepping on each other. That someone can also be Claude.

## Worktrees are great (but fiddly)

[Git worktrees](https://matklad.github.io/2024/07/25/git-worktrees.html) let you check out multiple branches simultaneously, each in its own directory. Instead of stashing, switching, and losing context, you can have both branches open at once.

This matters more now than it used to. When you are running multiple Claude sessions, one exploring a refactor, one fixing a bug, one trying a completely different approach, worktrees are the difference between manageable and chaos. Git worktrees are also [one of the ways Anthropic suggests using Claude Code](https://code.claude.com/docs/en/common-workflows#run-parallel-claude-code-sessions-with-git-worktrees).

The problem is that git's worktree commands are designed for occasional use, not for constantly spinning up and tearing down:

```bash
git worktree add ../feature-foo -b feature-foo
cd ../feature-foo
# work
cd ../main-repo
git worktree remove ../feature-foo
git branch -d feature-foo
```

Not [tar command flag](https://xkcd.com/1168/) terrible, but enough friction that you think twice, or accidentally create the wrong branch/path frequently. Path conventions, branch-exists-or-not logic, proper cleanup. Just annoying enough that you do not bother.

So I asked Claude to write a wrapper. About 900 lines of bash that I never think about:

```bash
wt create earl/fib-123-feature   # Create worktree and branch
wt list                          # See all worktrees with health status
wt switch                        # Fuzzy-find and jump (requires fzf)
wt delete earl-fib-123-feature   # Clean up everything
```

The create command handles branch detection automatically:

```bash
if git show-ref --verify --quiet "refs/heads/$branch" 2>/dev/null; then
    git worktree add "$worktree_path" "$branch"
elif git show-ref --verify --quiet "refs/remotes/origin/$branch" 2>/dev/null; then
    git worktree add "$worktree_path" -b "$branch" "origin/$branch"
else
    git worktree add -b "$branch" "$worktree_path"
fi
```

The list command shows what is actually running:

```text
NAME                           STATUS          FRONTEND             BACKEND
----                           ------          --------             -------
earl-fib-123-feature           Healthy         Running              Running
main                           Healthy         Running              Running
experiment-new-approach        Degraded        Running              CrashLoopBackOff
```

And the `--go` flag creates the worktree, changes into it, and launches Claude Code in one motion:

```bash
wt create earl/fib-123-feature --go
```

This feels almost too simple to write about. It is just a bash script.

But the compound effect matters. I now create worktrees freely. Zero mental overhead. That changes behaviour. I am more willing to try speculative approaches, more willing to have three Claudes exploring three solutions in parallel.

Twenty minutes of Claude's time writing the script. Hours of my time saved. That is the pattern: not "AI writes my codebase" but "AI builds the tooling that makes me faster."

## The isolation problem

```visualization:port-collision
```

Thirty minutes into enthusiastic worktree use:

```text
Error: listen EADDRINUSE: address already in use :::3000
```

Two worktrees. Both want port 3000. One wins, one loses, and now you are playing "which terminal is running what?"

Annoying, but survivable. Look up how to configure where it's listening—maybe it's `PORT`, maybe it's `PORTO` if they like sweet wine. `PORT=3001 npm run dev`. Fine.

Then you hit the database. And then the filesystem. Or a cache. Or an object store. Or a background worker.

One extra worktree? These are non-issues. Three or four in parallel—which is the whole point—constant friction.

The fundamental problem: worktrees give you separate code, but everything else is shared. Ports, databases, processes, the whole runtime. You need actual isolation.

You could use Docker Compose per worktree, but that leads to port mapping hell. You could use different ports everywhere, but that works until you forget which is which. You could just be careful, but that does not scale with multiple AI agents running autonomously. Or you could use real namespace isolation, where each worktree gets its own everything.

That last option is what I want. The tool that does namespace isolation well is Kubernetes.

I know. But hear me out.

## Kubernetes: who cares about YAML now?

I have been a Kubernetes sceptic for years. The joke about "we replaced our monolith with 500 YAML files" lands because it is true. K8s makes sense at scale, when you have 50 or more engineers standardising deployments. For a small team, it was historically an insane choice. Docker Compose. Shell scripts. Just make it a SystemD service, you'll be fine.

But... all of the overhead of k8s is in the YAML, and Claude does not mind YAML. Claude seems to like YAML? Claude wakes up thrilled every day to shave that Yak.

The value of Kubernetes has always been real. Namespace isolation, declarative infrastructure, proper networking. The problem was the tax. Someone had to write those manifests. Debug the networking. Update the Helm charts. For local dev, that tax was never worth paying.

But "Claude, add a new service to the worktree chart" takes a minute. Documentation-diving takes an hour. The tax dropped by an order of magnitude.

So now I run k3d locally, a lightweight Kubernetes that runs in Docker:

```yaml
apiVersion: k3d.io/v1alpha5
kind: Simple
metadata:
  name: fibonacci
servers: 1
agents: 2

ports:
  - port: 80:80
    nodeFilters: [loadbalancer]

registries:
  create:
    name: fibonacci-registry
    hostPort: "5111"
```

Each worktree gets its own namespace. Complete isolation. The feature branch can drop tables, run destructive migrations, seed garbage test data. Main does not notice.

Branch names become namespaces automatically:

```bash
get_current_worktree() {
    git branch --show-current 2>/dev/null | \
        tr '/' '-' | \
        tr '[:upper:]' '[:lower:]' | \
        sed 's/[^a-z0-9-]/-/g' | \
        cut -c1-63
}
```

`earl/FIB-123-new-feature` becomes `worktree-earl-fib-123-new-feature`.

This is not about Kubernetes being the right way. It is about cost and benefit. When setup cost drops by 10x, things that were not worth doing become worth doing.

## Making k8s actually pleasant

Kubernetes gives you isolation. It also gives you new problems. Where are my logs? What is the URL? Which namespace am I looking at?

### Shared infrastructure, isolated applications

```visualization:namespace-architecture
```

Not everything gets duplicated. The cluster has two kinds of namespaces: one `infra` namespace for shared services, and one `worktree-{name}` namespace per branch.

Postgres, Temporal, Grafana, the observability collectors, all live in infra. Your application pods, workers, and ingress rules live in the worktree namespace.

Shared infrastructure, isolated applications. The expensive stuff runs once. The cheap stuff gets cloned.

```text
infra/
  postgresql (shared)
  temporal-server (shared)
  grafana, prometheus, jaeger, loki (shared)
  otel-collector (shared)

worktree-main/
  frontend, backend, temporal-worker (isolated)

worktree-earl-fib-123-feature/
  frontend, backend, temporal-worker (isolated)
```

This split is the core architectural decision. Everything else follows from it.

Without care, k8s dev becomes `kubectl get pods -n worktree-something | grep whatever` and memorising port numbers. Two things make it ergonomic: proper ingress for routing and the shared observability stack.

### Subdomain routing

Every worktree gets a URL from its branch name:

```text
http://main.localhost                   → worktree-main
http://earl-fib-123-feature.localhost   → worktree-earl-fib-123-feature
```

The ingress configuration:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
spec:
  rules:
    - host: {{ .Values.worktree.name }}.localhost
      http:
        paths:
          - path: /
            backend: { service: { name: frontend, port: 3000 } }
          - path: /api
            backend: { service: { name: backend, port: 8000 } }
```

Running `wt status` gives you usable URLs immediately, `wt open` takes you to the frontend and `wt open service` takes you to that service:

```text
Access URLs:
  Frontend: http://earl-fib-123-feature.localhost
  GraphQL:  http://earl-fib-123-feature.localhost/graphql
  API:      http://earl-fib-123-feature.localhost/api
```

No more wondering whether the frontend is on port 3001 or 3002.

### Shared observability

Worktrees are isolated. Monitoring is shared. A single infra namespace runs Grafana at `grafana.localhost`, Prometheus at `prometheus.localhost`, Jaeger at `jaeger.localhost`, and Loki for logs queried through Grafana.

All worktrees send telemetry to one OpenTelemetry collector:

```yaml
receivers:
  otlp:
    protocols:
      grpc: { endpoint: 0.0.0.0:4317 }

exporters:
  otlp/jaeger: { endpoint: jaeger:4317 }
  prometheus: { endpoint: "0.0.0.0:8889" }

service:
  pipelines:
    traces: { receivers: [otlp], exporters: [otlp/jaeger] }
    metrics: { receivers: [otlp], exporters: [prometheus] }
```

Each worktree pod points to it:

```yaml
OTEL_EXPORTER_OTLP_ENDPOINT: "http://otel-collector.infra:4317"
```

Open Grafana, filter by namespace, see exactly that worktree's logs, metrics, and traces. Or view all worktrees side by side. Data is labelled, so there is no confusion about what came from where.

This matters for debugging. Instead of ~4 roundtrips to k8s to find the pods it wants, try and find the logs, grepping logs for errors, Claude can look at the actual trace of a failed request. Spans, timing, the full picture. Far more signal than scrolling through stdout.

### Grafana MCP

I've been experimenting with the Grafana MCP tool. It works, but the tool definitions consume substantial context. I built a wrapper that hides the MCP inside a subagent, so my main session just gets a link to a temp file with the relevant logs or traces. The problem: it's hard to get Claude to actually use it.

This is a trait Claude learned from humans. When I worked at The Climate Corporation, we had a big, beautiful Splunk server—probably costing us a hideous amount in licensing fees. But I had ssh access and grep, so I did most of my debugging in the terminal anyway. Claude does the same thing. Just because you build excellent infrastructure doesn't mean your engineers will use it.

## Temporal and workflow isolation

### Workflow engines and the isolation problem

If you run background jobs or workflows, you have another isolation problem. Two worktrees running the same workflow type will step on each other unless you separate them.

We use Temporal for long-running research jobs. The naive approach would be one Temporal cluster per worktree. That is expensive and slow to spin up. Instead: shared cluster, isolated namespaces.

```yaml
# Each worktree gets its own Temporal namespace
temporal:
  address: "temporal-frontend.infra.svc.cluster.local:7233"
  namespace: "worktree-{{ .Values.worktree.name }}"
```

One Temporal server runs in the infra namespace. Each worktree's worker connects to it but registers in its own namespace. Workflows in `worktree-main` cannot see or interfere with workflows in `worktree-earl-fib-123-feature`.

This is the same pattern as the database isolation: shared infrastructure, separated data. The Temporal cluster is expensive to run. The namespace is just metadata.

### The metrics port problem

Temporal workers expose Prometheus metrics. Two workers on the same port conflict. You could hardcode different ports per worktree. That does not scale.

Instead, derive the port from the namespace:

```python
def _derive_port_from_namespace(namespace: str, base_port: int = 9090) -> int:
    if namespace == "default":
        return base_port
    checksum = zlib.crc32(namespace.encode()) & 0xFFFFFFFF
    return 9100 + (checksum % 100)
```

`worktree-main` gets 9090. `worktree-earl-fib-123-feature` gets some port in 9100-9199, derived deterministically from the name. No coordination needed. No manual assignment.

This is the kind of detail I would never have bothered with if I had to implement it myself. It took Claude about ten minutes. Now every worktree has its own metrics endpoint, automatically, forever. Some day, these ports will collide. And it'll be okay—I'll have Claude fix it then. It won't take that long, and won't be that painful.

## The database question

```visualization:database-branching
```

Databases are the hard part. Pods, networking, filesystems are cheap to duplicate. Databases have state. State is heavy.

The dream is Neon-style branching. Instant copy-on-write forks. Running `wt create` gives you a database that looks like production but is completely isolated. Changes in one branch do not touch any other.

I do not have that locally. What I have is PostgreSQL template databases. Good enough:

```sql
CREATE DATABASE wt_earl_fib_123_feature
WITH TEMPLATE drug_screening_template;
```

The seed script handles it:

```bash
clone_from_template() {
    local db_name="wt_${worktree_name//-/_}"
    local template_db="drug_screening_template"

    kubectl exec -n infra postgresql-0 -- psql -U fibonacci -d postgres -c "
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = '$db_name' AND pid <> pg_backend_pid();
    "

    kubectl exec -n infra postgresql-0 -- psql -U fibonacci -d postgres -c "
        DROP DATABASE IF EXISTS \"$db_name\";
        CREATE DATABASE \"$db_name\" WITH TEMPLATE \"$template_db\";
    "
}
```

This works for a handful of worktrees. It's not instant, and each database is a full copy, but it's good enough.

What I actually want is Neon-style copy-on-write branching. The good news: this space has matured.

### The landscape in 2025

[DBLab Engine](https://postgres.ai/) wraps ZFS copy-on-write for ten-second clones at terabyte scale. [PostgreSQL 18](https://www.postgresql.org/docs/18/sql-createdatabase.html) added native `STRATEGY=clone` for instant branching on CoW filesystems. [Neon](https://github.com/neondatabase/neon) is fully open source and can be self-hosted with the Molnett operator. [CloudNativePG](https://cloudnative-pg.io/) with ZFS VolumeSnapshots is the Kubernetes-native path.

All the good options need Linux with ZFS or Btrfs. Template cloning works fine for my current database sizes. When it becomes a bottleneck, I'll have Claude set up something better.

## What this looks like in practice

Here is what this looks like in practice:

```bash
wt create earl/fib-456-new-thing --go

wt create earl/fib-456-alternative --go

wt list
# NAME                      STATUS    FRONTEND    BACKEND
# earl-fib-456-new-thing    Healthy   Running     Running
# earl-fib-456-alternative  Healthy   Running     Running
# main                      Healthy   Running     Running

wt open earl-fib-456-new-thing
wt open earl-fib-456-alternative
```

Three isolated environments. Each has its own database, own networking, own services. No port conflicts. No shared state. No confusion about which terminal is which.

None of this is novel. Worktrees, namespaces, Traefik, template databases have all existed for years. What changed is that setting it up used to take days if you were really comfortable with k8s, and a lot longer if you were learning the concepts.

### How long this actually took

Fifteen to twenty hours spread over a couple weeks. The initial k8s setup took the longest. The observability stack needed a few iterations. The `wt` script evolved as I hit edge cases.

But compare that to what it would have taken without Claude writing the YAML and debugging the helm chart issues. I would have given up. The project would have died in the "this is taking too long, I will just be careful about ports" phase.

### What you need to know

If you have written a docker-compose file, you can probably do this. You do not need to be a Kubernetes expert. Claude handles most of the k8s-specific knowledge. You need to understand the concepts, containers, networking, why isolation matters, but not the implementation details of Helm templating or ingress annotations.

### What it costs

Everything here runs locally. k3d is free. Temporal runs in the cluster, not Temporal Cloud. The only cost is compute.

With three worktrees active, my setup uses about 12GB of RAM across the k3d nodes. That is with frontend, backend, temporal worker per worktree, plus the shared infra namespace running Postgres, Temporal server, and the full observability stack. CPU sits around 5-10% when idle.

If your laptop does not have 32GB of RAM, consider a Hetzner server for around forty dollars a month. Plenty of headroom. Or if you have an AWS/Azure/GCP account from work and a CFO who really hates money, deploy it there.

### When things break

I ask Claude to fix it. Seriously. The infrastructure is documented well enough that Claude can debug its own work. When the observability stack had issues, I pointed Claude at the helm charts and the error logs. It figured out what was wrong.

This is part of why I emphasise "own it yourself." I can read the configs. I understand what they are supposed to do. I just do not want to be the one writing the YAML from scratch or hunting down typos in label selectors.

The leverage is not in the "AI" part. It is in what the AI makes feasible.

### Unwrapping the inner loop

The real pattern here isn't "use AI to write infrastructure." It's noticing when something is slowing you down and pointing Claude at it.

Port conflicts? Have Claude write a worktree wrapper. Database collisions? Have Claude set up template cloning. Can't tell which environment is which? Have Claude configure Traefik with subdomains. Each friction point becomes a prompt.

This compounds. Once you have isolated environments, you notice that cold starts are slow. So you have Claude optimize the Helm charts. Then you notice logs are scattered. So you have Claude add OpenTelemetry. Each fix makes the next problem more visible, and each problem is something Claude can help with.

### What I still want

I want real database branching. I want faster cold starts, because the first `wt up` in a new worktree still takes a couple of minutes. I want automatic cleanup that garbage collects worktrees untouched for a week.

But even without those improvements, this setup changed how I work. I'm more willing to try speculative approaches. I can context-switch without losing state. I run experiments I would have been too lazy to set up before.

### If you want to try this

Start with the worktree wrapper. It is the easiest win. Ask Claude to write you a `wt` script that handles create, list, switch, and delete. Customise it for your naming conventions. This takes an hour and pays off immediately.

If that feels good, add k3d. Start with a single namespace that runs your existing docker-compose services. Get comfortable with `kubectl` basics. Then add a second namespace for a feature branch. See how it feels to have two isolated environments.

The observability stack and database templating can come later. They are nice to have, not essential. The core value is in the isolation itself.

I will write up the production deployment side of this in a follow-up post. How the worktree namespaces map to preview environments, how we handle migrations across branches, the CI/CD integration. Different problems, same pattern: Claude handles the tedious parts.

## The thing I keep forgetting

One of the hardest adjustments is unlearning the shortcuts. My instincts were honed shipping code under pressure, where "do it right" meant "do it later, if ever." The hack that worked was better than the proper solution that took too long.

Those instincts are now miscalibrated. Setting up real namespace isolation instead of juggling port numbers. Writing a proper wrapper script instead of remembering the incantation.

I spent years in iterative improvement. I find myself now going directly to the version I actually wanted. Not because I have more discipline, but because the economics changed. The right way is not much harder than the wrong way when someone else writes the code.

Your team of Claudes needs a platform team. Someone has to build the scaffolding that lets them work in parallel without stepping on each other. That someone can also be Claude.

---

## Appendix: other approaches

This is not the only way to solve the isolation problem. Here are some alternatives I have been watching.

### Gas Town

Steve Yegge released [Gas Town](https://github.com/steveyegge/gastown), an agent orchestration system where named workers patrol your codebase and handle different concerns. It is ambitious and chaotic in the best way. I have not tried it yet because I am waiting for the dust to settle:

> Apologies to everyone using Gas Town who is being bitten by the murderous rampaging Deacon who is spree-killing all the other workers while on his patrol. I am as frustrated as you are. Fixes incoming in v0.4.0, but for now, please run your town with no Deacon.
>
> — [Steve Yegge](https://x.com/steve_yegge/status/2009108074062041255)

### Durable agent environments

Kurt Mackey at Fly.io wrote about [why ephemeral sandboxes are wrong for agents](https://fly.io/blog/code-and-let-live/). His solution is "Sprites": durable micro-VMs with instant checkpoint and restore. Create one in a second, install dependencies, checkpoint. Come back days later, everything is where you left it.

This solves a different slice of the same problem. My worktree setup is local; Sprites are the cloud-native version. The checkpoint/restore angle is interesting for database state too.

### Nix

If your environment is fully declarative, `nix develop` gives you everything, every time, on any machine. I have bounced off Nix three times. Maybe the fourth attempt will stick.

### Preview environment platforms

Railway, Render, and similar platforms offer instant preview environments per PR, sometimes with database branching. They solve production hosting rather than local dev, but the infrastructure patterns are converging.
