---
title: "Think First, Diffuse Fast"
date: "2026-02-18"
description: "Diffusion language models are 10x faster but worse at reasoning. A simple planning prefix closes the gap — no training required."
slug: "think-first-diffuse-fast"
---

Diffusion language models generate text by denoising all tokens in parallel — making them 10x faster than standard autoregressive models like LLaMA or GPT. The catch: they're consistently worse at reasoning tasks. We think this is a coordination problem. When you generate everything at once, there's no sequential chain to keep your logic coherent.

The fix is embarrassingly simple: have a frontier model write a short (~100 token) plan, then paste it in front of the diffusion model's prompt. No training, no architecture changes — just a few sentences of strategy.

On GSM8K, this takes LLaDA-8B from 75.6% to 87.2%, fully closing the gap to a same-size autoregressive model. On HumanEval (code), the gain is even larger: +12.8pp. The same plans help LLaMA by only +1.3pp on code — diffusion models benefit up to 10x more, because they're the ones with the coordination problem.

A few findings we didn't expect: plan-conditioned accuracy has zero variance across random seeds (diffusion inference becomes deterministic), wrong-strategy plans are catastrophic (-16.3pp) but wrong-number plans barely matter (-1.1pp), and attention maps show the model reads plans 1.8x more than expected during early denoising — exactly when the output canvas is still noise.

![First page of the paper](/think-first-diffuse-fast-p1.png)

[Read the full paper (PDF)](/think-first-diffuse-fast.pdf)
