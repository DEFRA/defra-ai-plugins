---
name: synthetic-usability-review
description: >-
  Check a working service for usability problems before testing it with real
  people. Try real jobs in a browser as the people who use it, check each screen
  against Nielsen's 10 usability heuristics, Microsoft's Guidelines for Human-AI
  Interaction and the GOV.UK Design System, and write a plain English report.
  Use for a heuristic or expert review, synthetic usability testing, or a
  usability check before research. Not a replacement for research with real
  people.
---

# Synthetic usability review

This is a check you do before real research. You pretend to be the people who use a service. You try to do real jobs with it. You write down every place you get stuck.

It finds problems that almost anyone would hit. That saves real people's time for the harder questions.

It cannot tell you what a real person thinks, feels or types. Tools like this are built to prepare for research with real people, not to replace it [13]. Early research also suggests that AI personas can match patterns across a group, but not predict what one person will do [15]. Say this near the top of every report.

The numbers in square brackets point to the sources at the end.

## Before you start

### Keep it safe

- **Test a practice copy or a test environment**, not the live service, unless the person who owns the service says you can.
- **Use made-up details.** Never type real names, addresses, reference numbers or anything else about a real person.
- **Never finish anything that does something real.** Do not send an application, make a payment, or send a message to a real person.
- **Never enter real passwords or payment details**, even if the user offers them.
- **Never try to get past a CAPTCHA** or any other check that a person is not a robot. Stop and tell the user.
- **Watch out for logins.** Some browser tools use your own logins, so they can act as you on any site you are signed into [17]. Use a browser, or a browser profile, that is not signed in to anything you do not need.
- **Check shared documents first.** If someone shares research notes to describe their users, check that personal details have been taken out before you read them.
- **Keep the report inside your organisation.** It may show screenshots of a service that is not public yet.

### Check what tools you have

This skill works best with a way to use a real browser. Most AI assistants now have one. As of September 2026, for example:

- Claude has Claude in Chrome, and Claude Code has its own built-in browser [17]
- GitHub Copilot has browser tools in VS Code [18]
- ChatGPT and Codex share a desktop app with a browser in it [19]

These change often, so check what yours has today.

**Never install anything.** Do not install an extension, a package, a script or a server, and do not ask the user to run one for you. Only use what is already there.

**If there is no browser, tell the user what that means**, in plain words:

> I can't use a browser here, so I can't click through your service myself. That means I can't time how long things take, check what the page sends to other companies, or try the same question twice. I can still review screenshots and page text that you send me, and check the rest against the rules.

Then offer that route. The user does the jobs and sends you what they saw, and you review that. Say in the report that this is how it was done.

### Say what it will cost

If the service uses AI, every job may cost money to run. So will the second reviewer in step 4. Tell the user before you start.

## Step 1: ask before you start

Every service has different people and different jobs, so never guess them. Ask the user four things.

**1. Who uses it?**
Ask the user to describe the people, or to share a document that does. Personas, a research plan or a list of user needs all work. Take them in whatever form they come.

Two to five people is plenty. Pick people who come for different reasons, because they find different problems. If the user writes them as user needs, a good shape is "As a... I need to... So that...". Do not insist on it.

**2. What are they trying to do?**
Ask for a handful of jobs, often around ten, shared out between the people. A job is a situation, not an instruction. "You pasted names into ChatGPT by mistake. Find out what to do" is a job. "Open the incident page" is not.

If the user has no jobs, suggest some and ask them to check. Try to include one job where the right answer depends on who is asking. Those find the problems that general jobs miss.

**3. Where is it running?**
Get the web address. Ask if it is real or a practice copy. A practice copy with made-up answers is fine for checking layout, links and error pages. It cannot tell you if the answers are any good.

**4. Which screens exist?**
List every screen a person could land on. Include errors, empty screens, waiting screens and anything that says no.

Suggest your own draft of all four from what you can see, and let the user correct it. At the end, offer to save the people and jobs so the next review can start from them.

## Step 2: do the jobs, as each person

Use a real browser if you have one. If not, work from what the user sends you (see "Check what tools you have"). This step is a cognitive walkthrough [5]. At each step, ask these four questions as that person, in the method's own words:

1. Will users try to achieve the right result?
2. Will users notice that the correct action is available?
3. Will users associate the correct action with the result they're trying to achieve?
4. After the action is performed, will users see that progress is made toward the goal?

A "no" to any of these is a finding.

**Before you judge an answer, say what this person needed to hear.** Write it down first, then read the answer. An answer can be good in general and still be wrong for this person. For example, someone from another organisation may need a different route to the one the service gives its own staff.

**Show your evidence.** Every finding needs a screenshot or the page text, and the steps that got you there. No evidence, no finding. Benchmarks of AI reviewers make them collect evidence by using the interface before they report [14], and so should you.

**Check what the page sends away.** Open the browser's network log. Note anything sent to another company, like analytics, and what it carries. Words a person typed should never be in it. None of the three rule sets in step 3 cover this, so you have to look.

**Ask some questions twice.** AI services do not always give the same answer. Run two or three jobs a second time and compare. A job that works once and fails once is a finding.

**Time it.** Note how long each answer takes, and whether the page shows anything while you wait.

**Check a phone-sized screen too.**

### Tips for the browser

Browser tools can miss clicks and type too early. If that happens:

- Wait for the page to finish loading before you type
- Check your words are in the box before you send
- If clicking keeps failing, press Enter, or click by position on the screen
- If it still fails, send the request from inside the page, and say so in the report

Do not report your tool's problems as the service's problems. If you are not sure which it is, say so.

## Step 3: check against three sets of rules

Go screen by screen. Mark each finding with every rule it breaks.

**Nielsen's 10 usability heuristics [1]**

1. Visibility of System Status: show people what is happening
2. Match Between the System and the Real World: use words and ideas people know
3. User Control and Freedom: let people undo and leave
4. Consistency and Standards: do things the way people expect
5. Error Prevention: stop mistakes before they happen
6. Recognition Rather than Recall: let people see things, not remember them
7. Flexibility and Efficiency of Use: make it quick for people who use it often
8. Aesthetic and Minimalist Design: nothing extra
9. Help Users Recognize, Diagnose, and Recover from Errors: help people see, understand and fix errors
10. Help and Documentation: help when people need it

**Microsoft's 18 Guidelines for Human-AI Interaction [6]** (skip these if the service has no AI)

Initially:

1. Make clear what the system can do.
2. Make clear how well the system can do what it can do.

During interaction:

3. Time services based on context.
4. Show contextually relevant information.
5. Match relevant social norms.
6. Mitigate social biases.

When wrong:

7. Support efficient invocation: make it easy to ask for.
8. Support efficient dismissal: make it easy to ignore.
9. Support efficient correction: make it easy to fix.
10. Scope services when in doubt: ask, or do less, when it is not sure.
11. Make clear why the system did what it did.

Over time:

12. Remember recent interactions.
13. Learn from user behavior.
14. Update and adapt cautiously.
15. Encourage granular feedback: ask for feedback on each answer.
16. Convey the consequences of user actions.
17. Provide global controls.
18. Notify users about changes.

**GOV.UK**

- When there is an error, summarise it at the top of the page with an error summary, and "add 'Error: ' to the beginning of the page `<title>`" [7]
- Do not use a notification banner to tell people about validation errors [8]
- When the service itself fails, follow the "problem with the service" pattern, and keep what the person entered if you can [9]
- Accessibility to WCAG 2.2 at level AA: contrast, zoom, focus, target size, and what a screen reader says [10]
- "Plain English is mandatory for all of GOV.UK" [11], and "put the most important information first" [12]
- For AI services, what GOV.UK Chat learned: it is better to give a partial answer, or no answer, than a misleading one. When it cannot help, it should still give people a way forward [16]

## Step 4: get a second reviewer

A single reviewer finds only about a third of the problems. Across six projects, single evaluators found 35% on average. Nielsen recommends about five reviewers, and at least three [3]. They should work on their own, so they do not influence each other [2].

This skill uses two to keep the cost down, so expect to miss some problems. Use more if the review matters.

**How to get one.** The second reviewer must start fresh, with no memory of your review. If you can start a sub-agent, or a new conversation, use that. If you cannot, ask the user to open a new conversation with this skill, give it the brief below, and bring back only its list of findings. Do not just pretend to be a second reviewer in this conversation, because you would not be independent.

Give the second reviewer:

- the people and the jobs
- your evidence: the screenshots, the page text and the timings
- the three sets of rules
- any design decisions that were made on purpose, and why

Do not give them your findings.

Ask them to keep a separate list of design decisions they disagree with. That way they will not report a deliberate choice as a mistake, and they can still challenge it.

Then join the two lists and remove repeats.

**If there is no way to get a second reviewer at all**, do a second pass yourself later. Read only the evidence, not your findings, and look through a different lens: for example, go through the jobs as a different person, or one set of rules at a time. Say in the report that this is less independent than a second reviewer.

## Step 5: sort what you found

Rate each finding after you have joined the lists, not while you are finding them. Each reviewer rates on their own, then you take the average [4].

**First, put it in a group.** Ask these questions in order and use the first "yes". Nothing can sit in two groups.

| Group                       | The question                                                           |
| --------------------------- | ---------------------------------------------------------------------- |
| **Fix before research**     | Would a person get stuck, give up, or be put at risk?                  |
| **Fix before going public** | Would it leak data, break a rule, or lose the public's trust?          |
| **Fix when we can**         | Do people get through, but slower or less sure than they should be?    |
| **Polish**                  | Does something look or read slightly off, without slowing anyone down? |

These four groups are this skill's own, to say _when_ to fix something.

**Then rate how bad it is**, on Nielsen's scale [4]. Think about how often people will meet it, how hard it is to get past, and whether it keeps happening.

- 4: Usability catastrophe. Must fix before release
- 3: Major usability problem. High priority
- 2: Minor usability problem. Low priority
- 1: Cosmetic problem only. Fix if there is time
- 0: Not a usability problem

If the two reviewers' numbers are 2 or more apart, say so, because the team should talk about it.

## Step 6: write the report

Write for someone new to the service, at a reading age of 9. Use short sentences and everyday words. Say what the person sees, not how the code works.

**The shape of the report**

1. **What we did.** Who you pretended to be, what jobs you tried, and where. Then one line on what this cannot tell us.
2. **Fix these first.** Up to three findings that matter most, one line each.
3. **What we found**, in the four groups, in order.
4. **What works.** Things to keep, with evidence, so nobody undoes them by accident.
5. **What to test with real people.** Questions this review raised but cannot answer.

**For findings in the top two groups**, use five parts:

- **What happens:** what the person sees or does
- **Why it matters:** what it means for them
- **How we know:** the evidence, and which person and job found it
- **What to do:** a clear change, not just "improve it"
- **Who:** who should fix it, if you know

**For findings in the bottom two groups**, a table is enough: what happens, what to do, and who. This keeps the report short enough to read.

## Before you share it

- The report stays inside your organisation
- No real person's details appear anywhere in it
- Every finding has evidence
- Nothing is judged on made-up answers alone, unless it says so
- The people and jobs came from the user, not from you
- You checked the network log
- The report says near the top what it cannot tell us

## Sources

**Heuristic evaluation**

1. Nielsen, J. (1994, reviewed 2024). _10 Usability Heuristics for User Interface Design_. Nielsen Norman Group. https://www.nngroup.com/articles/ten-usability-heuristics/
2. Nielsen Norman Group. _How to Conduct a Heuristic Evaluation_. https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/
3. Nielsen, J. (1994). _The Theory Behind Heuristic Evaluations_. Nielsen Norman Group. https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/theory-heuristic-evaluations/
4. Nielsen, J. (1994). _Severity Ratings for Usability Problems_. Nielsen Norman Group. https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/

**Cognitive walkthrough**

5. Nielsen Norman Group. _Evaluate Interface Learnability with Cognitive Walkthroughs_. https://www.nngroup.com/articles/cognitive-walkthroughs/ The method was first set out by Lewis, Polson, Wharton and Rieman at CHI in 1990.

**AI products**

6. Amershi, S. and others (2019). _Guidelines for Human-AI Interaction_. CHI 2019. https://doi.org/10.1145/3290605.3300233 Also published by Microsoft in the HAX Toolkit: https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/

**GOV.UK**

7. GOV.UK Design System. _Error summary_. https://design-system.service.gov.uk/components/error-summary/
8. GOV.UK Design System. _Notification banner_. https://design-system.service.gov.uk/components/notification-banner/
9. GOV.UK Design System. _Problem with the service pages_. https://design-system.service.gov.uk/patterns/problem-with-the-service-pages/
10. W3C (2024). _Web Content Accessibility Guidelines (WCAG) 2.2_. W3C Recommendation. https://www.w3.org/TR/WCAG22/
11. Government Digital Service. _Use clear language_. Writing to GOV.UK standards. https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/writing-guidelines/clear-language/
12. Government Digital Service. _Create a clear structure for your content_. Writing to GOV.UK standards. https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/writing-guidelines/clear-structure/

**Research on AI reviewers and AI users**

13. _UXAgent: An LLM Agent-Based Usability Testing Framework for Web Design_. CHI 2025 Extended Abstracts. https://doi.org/10.1145/3706599.3719729
14. _UXBench: Measuring the Actionability of LLM-Generated UX Critiques_ (2026). Preprint. https://arxiv.org/abs/2606.16262
15. Ozkan, G. (2026). _Distribution-First Population Simulation: Collapse, Calibration, and Recall in Non-WEIRD LLM Persona Modeling_. Preprint. https://arxiv.org/abs/2607.18310
16. Government Digital Service (2026). _Developing GOV.UK Chat: our data science and AI engineering journey_. Inside GOV.UK blog. https://insidegovuk.blog.gov.uk/2026/05/15/developing-gov-uk-chat-our-data-science-and-ai-engineering-journey/

**Browser tools, as of September 2026**

17. Anthropic. _Use Claude Code with Chrome_. Claude Code docs. https://code.claude.com/docs/en/chrome
18. GitHub (2026). _Browser tools for GitHub Copilot in VS Code are generally available_. GitHub Changelog. https://github.blog/changelog/2026-07-01-browser-tools-for-github-copilot-in-vs-code-are-generally-available/
19. OpenAI. _Evolving Atlas into ChatGPT for browser-based agentic work_. OpenAI Help Center. https://help.openai.com/en/articles/20001371-evolving-atlas-into-chatgpt-for-browser-based-agentic-work

Sources 14 and 15 are preprints, which means they have not been peer reviewed yet.
