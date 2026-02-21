---
title: "Nonfatal Decisions"
date: "2026-02-08"
description: "Most technical decisions used to be expensive to reverse. Now they're not."
slug: "nonfatal-decisions"
---

There's a category shift happening in software development that I think is underappreciated. It's not about writing code faster. It's about the cost of being wrong.

Most technical decisions used to be expensive to reverse. Chose the wrong abstraction? That's a week of refactoring. Picked the wrong data model? Good luck migrating. Went down a dead-end architectural path? Hope you didn't burn too much time, because unwinding it is going to hurt.

This created a specific kind of engineering culture: measure twice, cut once. Extensive design docs before writing code. Long deliberation over technology choices. Careful, incremental changes. All of it rational, because the cost of reversal was high.

Now something has shifted. With AI coding tools, a huge category of mistakes has become trivially cheap to undo. You can rip out an abstraction and replace it in minutes. You can refactor across an entire codebase — crossing file boundaries, framework conventions, even language idioms — in the time it used to take to write a design doc about whether you should.

This isn't theoretical. I've been doing it routinely. Go down a path for an hour, realize it's wrong, and just... undo it. Not with `git checkout .` — actually undo it intelligently, refactoring to a better approach, because the cost of that refactoring has collapsed.

The implication is that a lot of decisions that used to feel high-stakes are now nonfatal. The wrong database schema, the wrong API shape, the wrong component hierarchy — these used to be decisions you lived with for months. Now they're decisions you live with until you decide to change them, which might be this afternoon.

This changes how you should work. Instead of spending three days choosing between approaches, you can try one. If it's wrong, the refactor costs less than the deliberation would have. You can proceed with velocity and confidence, not because you're sure you're right, but because you know being wrong is cheap.

The mental model I keep coming back to is: most technical decisions have become nonfatal. You can move fast not because you won't make mistakes, but because mistakes have gotten dramatically cheaper to fix. The bottleneck is no longer "avoid errors." It's "learn fast" — and you learn faster by building than by deliberating.
