---
title: "Scaling Visualizations"
date: "2026-01-21"
description: "How Claude Code changed what's possible for interactive explanations"
slug: "scaling-visualizations"
---

People take work with visualizations more seriously. They always have. A well-crafted interactive explanation signals that someone has put real time and effort into understanding what they're trying to communicate. It earns a kind of trust that prose alone doesn't.

Everyone who's ever worked on the front end has a copy of Edward Tufte's visualization book somewhere. Bartosz Ciechanowski's work at [ciechanow.ski](https://ciechanow.ski/) is the modern version of that aspiration. I find myself fascinated by his explanations, and I implicitly trust his technical descriptions because of the obvious care in the animation, illustration, and storytelling. The visualizations aren't just proving a point—they're earning credibility.

For most of us, that kind of work has been out of reach. It required either design skills we don't have or a team we'd need to coordinate. But I've been building interactive visualizations for blog posts using Claude Code—both here and at [fibonaccibio.com/blog](https://fibonaccibio.com/blog)—and the workflow has changed what I think is possible. When you have access to a phenomenal engineer who's willing to do the tedious work, it makes sense to ask for something more ambitious than a static diagram.

This is a short description of how that process works.

```visualization:build-loop
```

## The workflow starts during writing

The process doesn't begin when I'm done with a blog post and decide to jazz it up. It happens while I'm writing, when I notice something isn't quite working—a concept that's difficult to explain, a description that feels flat, a moment where I'm reaching for tools that aren't suited to what I'm trying to say.

Sometimes a visualization is the answer when a section is just getting boring and needs something to break up the monotony. But more often, the real candidates are descriptions of things that unfold over time, or relationships that are easier to explore in a small simulator than to parse in prose. These aren't decorations. They're a faster, more engaging way to help someone actually understand an idea.

When I spot a section that could benefit from this treatment, I don't stop writing to build it. I drop a placeholder comment into the draft describing what the visualization should show and why it matters. The writing keeps moving. The ideas accumulate.

## Getting Claude to be ambitious

Claude is a phenomenal engineer. It's also, by default, a conservative one.

Left to its own devices, Claude will propose the safe option: a static diagram, a simple chart, a table that technically conveys the information. This isn't a flaw exactly—it's trying to be helpful without overcommitting your time or resources. But it means you have to explicitly unlock the more ambitious work.

I tell Claude, directly, that I'm willing to put real effort into this. That I want it to think about whether the concept would be better served by something interactive, something animated, something a reader can play with. I tell it to make things spicy. This sounds simple, but it matters. Without that nudge, Claude will forget what it's capable of and default to the path of least resistance.

The other thing I've learned is that you have to give Claude permission to spend your compute. It has an instinct to be efficient, to wrap things up quickly, to not ask for too much. When you're building visualizations, that instinct works against you. I'd rather Claude take three passes at getting an animation right than ship something underwhelming on the first try.

## The human review loop

Once the draft has enough shape that I know what I'm actually trying to say, I work through the visualizations one at a time.

The review step is where I spend most of my time, and where most of the iteration happens. Claude cannot reliably catch its own visual bugs. It struggles to understand screenshots of animations that aren't at a start state, end state, or clearly defined pause point. It struggles with alignments. It doesn't know when colors clash, when a chart is subtly misleading, or when something that's technically correct still looks wrong to a human eye. Even with browser integration and the ability to see what it's built, Claude's visual judgment isn't trustworthy enough to skip manual inspection.

So I look at every visualization myself. I scrub through the animations. I check the data against what I know to be true. I look for the subtle things: labels that overlap, transitions that feel too fast, axes that don't make sense. When I find issues, I describe them to Claude, it fixes them, and I check again. This loop repeats until I'm satisfied.

One thing that does parallelize well: generating options. I'll often ask Claude to build three or four different approaches to a visualization, then review them side by side. The goal isn't to use all of them—it's to quickly understand what's possible and consolidate down to the best choice.

## The tech stack

The visualizations I build with Claude use Framer Motion and raw SVG. No charting libraries. No D3. No Recharts or Chart.js.

This choice gets made between me and Claude at the start of a visualization. We talk through what we're trying to show, and Claude proposes an approach. Charting libraries exist precisely because building visualizations from scratch is tedious. But they also constrain what's possible. When you want a scatter plot that morphs into a parallel coordinates chart, or a beeswarm plot with custom physics, or scroll-triggered animations that respond to exactly the right viewport positions, you end up fighting the library more than using it.

The cost of picking the wrong abstraction is low now. If we start down a path and it's not working, we go back to the drawing board and rebuild. Claude makes that cheap. This changes the calculus: you can try the more ambitious approach first, knowing that you're not committed to it if the implementation gets ugly.

Claude handles the math from scratch: coordinate transformations, scaling functions, path generation, positioning algorithms. It turns out this is exactly the kind of work Claude is good at. The code is more verbose than a library call, but it's also completely transparent. When something looks wrong, I can read the geometry and understand why.

Framer Motion handles the animation orchestration. Its scroll hooks and spring physics give you the polished feel without writing your own animation loop. The combination—Framer Motion for motion, raw SVG for rendering, Claude for the math—has been the right trade-off between flexibility and effort.

## The unlock

The reason this workflow matters is that it changes who can make this kind of work. Publication-quality interactive visualizations used to require either design skills I don't have or a team I'd need to coordinate. Now they require taste, patience for iteration, and access to Claude.

The bottleneck has shifted. It's no longer "can I build this?" It's "what should I show?" That's a better problem to have. The constraint is now the quality of your ideas, not the tools at your disposal.

I don't think this makes designers or visualization specialists obsolete. Someone like Bartosz Ciechanowski is still operating at a level I can't touch. But for the rest of us, the floor has come up dramatically. Work that would have been out of reach is now just a matter of sitting down and doing it.
