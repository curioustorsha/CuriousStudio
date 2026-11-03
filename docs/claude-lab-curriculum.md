# Claude Lab: the curriculum

Claude Lab teaches Claude from zero to power user, one short at a time. Every episode builds on the one before it and ends by setting up the next. Someone who finds episode 30 can scroll back to the start, and someone who starts at episode 1 has a reason to keep going.

**52 episodes in 8 modules.** That's one per Wednesday for all of 2027. If Claude Skills starts as a parallel series, Claude Lab can slow down or keep going alongside it.

**Order:** start with what everyone uses (the chat app), then Claude doing work for you (Cowork), then Claude Code for builders, then the API underneath, and finally skills as the bridge into the Claude Skills series.

> Claude changes fast. These are topics, not facts: each episode's Research run checks the current features, names and versions before anything is written. Reorder or merge episodes freely if a feature changes.

---

## How the episodes link

1. **Lesson kicker.** Every episode opens with a small kicker: `LESSON 14 · PROJECTS`.
2. **Callback in the first line (optional).** It picks up where the last episode ended, but the hook still has to work for someone who never saw it.
3. **A tease to close.** The last line raises the question the next episode answers ("So what happens when the desk is full?"). The "Leads into" column below is that line. Episodes still end with a payoff, and the tease comes right after it.
4. **Checkpoint episodes** close each module with a quick recap of what it covered. They are a good place to start for anyone who arrives mid-way.
5. **The same metaphors throughout.** See the metaphor sheet at the end. Once the desk is the context window, it's the desk forever.

---

## Module 1: Meet Claude (1–7)
*What Claude is and how it reads. Everything later builds on the desk.*

| # | Episode | What viewers learn | Leads into |
|---|---|---|---|
| 1 | What Claude actually is | A model made by Anthropic that writes one piece at a time, predicting what comes next. It's not a search engine or a database. | "It doesn't even read words. It reads tokens." |
| 2 | Tokens: how Claude reads | Text is broken into tokens (word pieces). Why "strawberry" is tricky, and why tokens are the unit of cost and length. | "And all those tokens have to fit somewhere." |
| 3 | The context window: Claude's desk | Everything Claude can see at once (your messages, files, its replies) sits on a desk of fixed size. | "So what happens when the desk is full?" |
| 4 | Why Claude "forgets" | A new chat means a clean desk. Long chats get summarised (compaction). Claude doesn't learn from your chat. | "So which Claude are you even talking to?" |
| 5 | Opus, Sonnet, Haiku | One family of models: the careful senior, the fast all-rounder and the quick runner. Speed, cost and depth trade off. | "There's also a reason Claude says no sometimes." |
| 6 | Why Claude says no | How Anthropic shapes Claude's behaviour (its constitution and training). Why it refuses, and how to rephrase honest requests. | "Now let's open the doors you can talk to it through." |
| 7 | One Claude, many doors *(CL-003)* | Web and mobile chat, the Desktop app, Cowork, Claude Code, the API: what each is for, and which one when. **Checkpoint.** | "Start with the simplest door: the chat. Most people use it wrong." |

## Module 2: Talking to Claude well (8–14)
*Prompting as briefing a smart colleague.*

| # | Episode | What viewers learn | Leads into |
|---|---|---|---|
| 8 | A prompt is a briefing | Context, goal, audience and constraints. A search-style query gets a generic answer. | "The fastest upgrade? Show it an example." |
| 9 | Show, don't tell | Examples pin down format and tone better than adjectives. | "Then tell it who it's talking to." |
| 10 | Who it's for | Audience and format instructions ("for a 10-year-old", "as a table"). | "Some questions need Claude to think first." |
| 11 | Extended thinking | Claude's scratch paper: it reasons before answering. When to switch it on, and the cost in time. | "Thinking helps. It can still be confidently wrong." |
| 12 | Hallucinations | Why a next-word predictor fills gaps with guesses, and how to catch them: ask for sources and quotes, or let it say "I don't know". | "Best fix: hand it the real material." |
| 13 | Giving Claude files | PDFs, images, spreadsheets and screenshots: what it can read, and what that costs on the desk. | "Uploading the same files every chat gets old." |
| 14 | Checkpoint: the good brief | The 6 habits so far in one card. | "Next: a desk that stays set up." |

## Module 3: Claude as your workspace (15–23)
*Making Claude remember, make things and reach the outside world.*

| # | Episode | What viewers learn | Leads into |
|---|---|---|---|
| 15 | Projects | A permanent desk: files and instructions that load into every chat in that project. | "Projects remember files. Claude can also remember you." |
| 16 | Memory | What Claude remembers about you across chats, where you see it and how to turn it off. | "So far it answers. It can also make things." |
| 17 | Artifacts | Documents, small apps and charts Claude builds next to the chat, which you can use and edit. | "And you can hand those to other people." |
| 18 | Sharing what Claude makes | Publishing and sharing artifacts and docs, and who can see them. | "Everything it knows has an expiry date, though." |
| 19 | Knowledge cutoff and web search | Training stops at a date. Search opens a window to today, with sources you can check. | "Search answers a question. Research answers a project." |
| 20 | Research mode | Many searches and one cited report. When it's worth the wait. | "It can read the web. What about your inbox?" |
| 21 | Connectors | Claude reads your Drive, Gmail and Calendar, only when you connect them and only what you allow. | "Every connector plugs into the same socket." |
| 22 | MCP: one plug for every tool | The open standard (Model Context Protocol) that lets any app plug into Claude, explained as a universal socket. | "So far Claude talks. Next, it does the work." |
| 23 | Checkpoint: your setup | Projects, memory, artifacts, search and connectors in one picture. | "Meet the agent." |

## Module 4: Claude does the work (24–30)
*From answering to acting: agents for everyday tasks.*

| # | Episode | What viewers learn | Leads into |
|---|---|---|---|
| 24 | Chat vs agent | The agent loop: think → act → check → repeat until done. | "There's an agent built for everyday work." |
| 25 | Cowork | Hand off a task, not a question: it works through files and apps on your computer. | "Working on your files? Let's talk about trust." |
| 26 | Permissions | What Claude may touch, when it asks first, and how you stay in control. | "It can even use your browser." |
| 27 | Claude in the browser | Claude navigates sites, fills forms and reads pages, with your sign-ins. | "And beyond the browser, your whole computer." |
| 28 | Computer use | Claude sees the screen and clicks and types like you do. What it's good and bad at. | "What if it worked while you slept?" |
| 29 | Scheduled tasks | Recurring jobs: a morning brief, a weekly report. | "For people who build software, there's a special door." |
| 30 | Checkpoint: what agents can do for you | Tasks you can hand off today, and ones you shouldn't. | "Claude Code." |

## Module 5: Claude Code basics (31–39)
*An agent that builds software. Useful even for non-developers ("vibe coding").*

| # | Episode | What viewers learn | Leads into |
|---|---|---|---|
| 31 | Claude Code in 60 seconds *(CL-001)* | An agent in your terminal that reads, edits and runs code. | "The first thing it does in a new project? Reads." |
| 32 | How it explores a codebase | It searches and reads files to build its own map before changing anything. | "Then it makes a plan." |
| 33 | Plan mode | Think first, edit later: review the plan before any change. | "Good plan. Now, how much freedom do you give it?" |
| 34 | Permission modes | Ask every time, accept edits, or auto mode. The trade-off between speed and safety. | "And when it gets something wrong?" |
| 35 | Checkpoints and rewind | Undo Claude's changes and go back to before a step. | "Stop repeating yourself every session." |
| 36 | CLAUDE.md | The note that stays on the desk: project rules Claude reads every session. | "Shortcuts for things you do every day." |
| 37 | Slash commands | `/compact`, `/clear`, `/model` and others, plus making your own. | "Long sessions fill the desk. Here's the fix." |
| 38 | Managing context in Code | Compact versus clear, and why a fresh desk often beats a messy one. | "And it's not only in the terminal." |
| 39 | Claude Code everywhere | Terminal, VS Code, desktop and web/cloud sessions. **Checkpoint.** | "One Claude is good. A team is better." |

## Module 6: Claude Code power tools (40–47)
*Teams, rules, connections and automation.*

| # | Episode | What viewers learn | Leads into |
|---|---|---|---|
| 40 | Subagents | Teammates with their own desks: they do a side job and hand back only the result, so your desk stays clear. | "Teammates can also work at the same time." |
| 41 | Working in parallel | Background tasks and separate worktrees: several jobs at once without collisions. | "Some rules can't be left to memory." |
| 42 | Hooks | Tripwires that always fire, e.g. format on every save or block a dangerous command. | "Next, connect it to everything else." |
| 43 | MCP in Claude Code | Plug databases, browsers and services into your coding agent. | "Got a setup you love? Package it." |
| 44 | Plugins | Bundle commands, agents, hooks and connections into one installable kit. | "Before you ship, get a second pair of eyes." |
| 45 | Code review with Claude | Reviewing a change for bugs, from a quick pass to a deep multi-agent review. | "What if you're not even there?" |
| 46 | Headless and GitHub | Claude Code running in scripts and CI: fixing issues and reviewing PRs on its own. | "Want to build your own agent like this?" |
| 47 | Checkpoint: your AI dev team | Subagents, hooks, MCP and plugins in one picture. | "Let's open the engine." |

## Module 7: Under the hood (48–50)
*The API every door is built on.*

| # | Episode | What viewers learn | Leads into |
|---|---|---|---|
| 48 | The API in 60 seconds | One request in, one reply out: messages, model and max tokens. Every Claude app is built on this. | "So how does Claude use a tool?" |
| 49 | Tool use | Claude asks your code to run a function, reads the result and continues. That's the agent loop, from the inside. | "Tokens are also money." |
| 50 | Cost: tokens, pricing and caching | What a request really costs, and how prompt caching makes repeated context cheap. | "One more trick: teaching Claude a job once." |

## Module 8: The bridge to skills (51–52)

| # | Episode | What viewers learn | Leads into |
|---|---|---|---|
| 51 | Skills: teaching Claude a job | A shelf of manuals. Claude reads only the spine labels until a job needs one, then opens that manual. Why that keeps the desk clear. | "Let's write one." |
| 52 | Your first skill | Building a simple skill step by step. Season finale. | "Next: the Claude Skills series." |

---

## The metaphor sheet

One world, **Claude's workshop**, used in every episode. Each idea gets its object once and keeps it forever. Storyboards add new rows here when a new idea first appears.

| Idea | Object in the workshop | First appears |
|---|---|---|
| Claude | A simple character at a workbench (shapes, no face icon) | 1 |
| Tokens | Small tiles that text breaks into | 2 |
| Context window | The desk: fixed size, everything Claude can see | 3 |
| Compaction | Sweeping the desk into one summary card | 4 |
| Opus / Sonnet / Haiku | Three workers: careful senior, fast all-rounder, quick runner | 5 |
| Prompt | A briefing card handed across the desk | 8 |
| Examples | Sample pieces pinned above the desk | 9 |
| Extended thinking | A scratch pad Claude works on before answering | 11 |
| Hallucination | A puzzle piece forced into a gap where it doesn't fit | 12 |
| Project | A desk that stays set up, with its own drawer | 15 |
| Memory | A small notebook about you | 16 |
| Artifact | A finished object placed on the counter | 17 |
| Web search | A window to the outside | 19 |
| Connector / MCP | Sockets on the wall, all the same shape | 21–22 |
| Agent loop | A loop track: think → act → check | 24 |
| Permissions | A key ring: which doors Claude may open | 26 |
| CLAUDE.md | A house-rules note taped to the desk | 36 |
| Subagent | A teammate at their own small desk, passing back one card | 40 |
| Hook | A tripwire across a doorway | 42 |
| Plugin | A packed toolbox you can hand to someone else | 44 |
| API | The engine room under the workshop | 48 |
| Skill | A manual on the shelf: only the spine is read until it's needed | 51 |

---

## Where the current Claude Lab ideas fit

- **CL-001 Claude Code in 60 seconds:** episode 31.
- **CL-003 Claude Code vs Cowork vs Desktop:** episode 7 (widened to every door).
- **CL-002 5 Claude skills worth installing:** move to the Claude Skills series.
- **CL-004 Vibe-coded app spotlight:** Claude Skills series or an occasional bonus episode, outside the numbered lessons.
