# Multi-page memory investigation, issue #38

The reported private project was not available through connected canvases. A new isolated local browser profile contained only the starter file. Measurements below use synthetic data, not the original project. They do not establish an unbounded leak or explain all native, raster, or GPU memory.

## What changed

Every file edit parsed a full file and retained the previous parsed object graph in its 80-entry undo history. Workspace navigation parsed every file again. Zod parsing creates new object identities, including for unchanged pages and layers.

Edits and library changes still parse before committing. Navigation only selects an existing validated file/page and updates its active-page ID, without reparsing artwork. It then reuses unchanged references from the previous validated state. Changed pages reuse individual previous nodes only when all parsed scalar fields match. New/imported values keep the parsed result, including normalization and defaults. Reference reuse relies on the existing immutable-state contract. Token dictionaries share only when their input reference is unchanged; active-page parsing can still create new equal token dictionaries. Undo depth, schema limits, file format, persistence, and network boundaries are unchanged.

## Iteration log

The state workload contains 100 pages, 100 rectangle layers per page, no images, and 100 edits to one layer. It retains 80 undo entries plus the current file. Every run verified 10,000 live layers, final x = 100, and final navigation destination `page-99`.

| Iteration | Change | Distinct node objects across history and current file | Outcome |
| --- | --- | ---: | --- |
| Baseline | Full-file parsing without sharing | 810,000 | Every snapshot retains every layer |
| 1 | Share untouched pages, documents, files and tokens after validation | 18,000 | Unchanged pages no longer multiply across history |
| 2 | Also share equal parsed nodes within a changed page | 10,080 | Only changed layer versions multiply across history |
| 3 | Navigate existing validated pages without full-workspace parsing | 10,080 | Avoid scanning every embedded image while switching pages |

Each iteration was run five times with identical object counts. The first two implementation measurements used a temporary state profiler. The final comparison below uses the committed profiler and alternates baseline/fixed runs to reduce drift. These are allocation measurements, not timing claims.

## Reproduce the state profile

```sh
node --expose-gc --import tsx scripts/profile-memory.mjs
```

Run from a checkout with installed dependencies. For the baseline, run the same script against source at `94f6f81`. The script changes only in-memory synthetic state. It does not open a browser, contact the broker, or read/write a real workspace. It reports post-GC Node.js heap, reference counts, history depth, and final content/navigation values. Without `--expose-gc`, `forcedGc` is false and heap values are not comparable to these results.

Five alternating baseline/fixed pairs on Node.js 22.23.4 produced:

| Metric | Baseline | Fixed |
| --- | ---: | ---: |
| Distinct retained nodes | 810,000 in every run | 10,080 in every run |
| Post-GC process JS heap, median | 154.26 MiB | 14.01 MiB |
| Post-GC process JS heap, range | 154.26–154.27 MiB | 13.99–14.01 MiB |
| Undo entries | 80 | 80 |
| Navigation preserves document reference | No | Yes |

The object-count reduction is 98.76%. The heap figures include Node, loaded schemas, fixture setup and profiler objects. They are not browser memory savings. Full-file schema parsing on edits still allocates temporary objects and remains a CPU cost. This change reduces retained copies, not validation work or image decode surfaces.

## Initial local Brave baseline

Brave 151.1.93.136, Chromium 151.0.7922.137, ran against the development/HMR app in a dedicated headless Linux profile. The synthetic file had 12 pages, 12 artboards, 300 layers, and 12 embedded 512×512 PNGs. Each PNG was 787,252 bytes; the workspace archive was 12,669,357 bytes. No private artwork was used.

Five reload runs collected CDP `Performance.getMetrics` after `HeapProfiler.collectGarbage`. Each run loaded the fixture, switched pages 24 times, then toggled a layer's visibility 24 times, waiting for saves to settle. Median post-GC JS heap was 22.66 MiB after load, 11.71 MiB after switching, and 13.15 MiB after edits. Ranges were 22.65–22.66, 10.78–12.09, and 12.65–13.16 MiB respectively. Repeated switching did not show monotonic post-GC growth.

An initial browser-store identity probe suggested whole-file duplication, but the follow-up probe imported a separate store instance reporting starter data instead of the visible fixture. Browser identity counts are therefore not accepted as reliable evidence. The independent state-only profile above establishes retained-object counts. UI undo/redo and IndexedDB contents were checked separately.

Summed Brave process RSS was about 1.08 GiB, while proportional set size was about 0.49–0.51 GiB and renderer RSS about 0.28–0.30 GiB. Summed RSS double-counts shared mappings. Neither process measure is equivalent to JS heap or an exact per-tab physical-memory measure. Development/HMR and browser utility processes are included; this is not a production-build comparison.

## Local Brave follow-up

The same five-run development protocol after sharing measured post-GC heap medians of 22.65 MiB after load, 10.95 MiB after 24 switches, and 11.99 MiB after 24 visibility edits. Ranges were 22.60–22.66, 10.80–11.44, and 11.33–12.51 MiB. Load and navigation ranges overlap the baseline; no browser-wide memory percentage is claimed. Page rename, duplication, deletion/undo, separate file histories, save/reload, and embedded-image presence passed UI checks. No runtime errors were observed.

## Mac Brave over Tailscale

A dedicated headed Brave 157.1.99.57 profile on macOS 27.2, Apple M2 with 16 GiB RAM, loaded the server application directly at `http://localmachine:5190` over Tailscale. The app did not run on the Mac. Only the CDP automation tunnel used loopback. Personal browser state was untouched.

The initial sharing-only pilot on the same 12-page fixture showed real stalls. 120 page-button clicks produced 120 long tasks totaling 15.1 seconds. After editing, 120 visibility changes produced 120 long tasks totaling 16.4 seconds. Dedicated Brave summed RSS was 905–930 MiB; summed macOS physical footprint peaked at 377 MiB and settled near 323–326 MiB. Post-GC JS heap settled near 23–25 MiB. These accounting quantities differ; the run does not establish which metric the original report used, and does not dismiss the observed lag.

A state-only cost probe of the fixture measured approximately 105 ms for a whole-workspace parse and 4.3 ms for one active-page parse on the server. Image payload validation was repeated on every navigation even though artwork did not change. Iteration 3 removes that navigation-only parse. Edits still validate the full file.

Five alternating Mac pairs compared iteration 2 with iteration 3, using the same browser, profile, fixture, development server, and 120 page-button clicks per run. Only the navigation implementation differed; this is not a comparison of untouched main with the complete fix.

| Metric | Reparse on navigation | Navigate validated state |
| --- | ---: | ---: |
| Long tasks per 120 clicks, median and range | 120, 120–120 | 6, 5–7 |
| Total long-task duration, median and range | 14,668 ms, 14,641–14,697 | 336 ms, 278–383 |
| Median programmatic click to two animation frames, median and range across runs | 132.0 ms, 132.0–132.1 | 29.9 ms, 29.9–30.1 |

Each run verified 12 page buttons, 120 completed clicks, the direct Tailscale origin, and final destination Board 01. Navigation saves were debounced during the loop; each pair waited a further second afterward. An independent settled run verified 12 saved pages and 300 layers. Programmatic click-to-two-rAF measurements are not physical input-to-photon latency. Development/HMR and automated rapid cycling limit generalization to normal production use.

A final stress pass after iteration 3 still measured 120 long tasks totaling 16.46 seconds during 120 visibility edits. That remaining editing cost is not fixed by this change. Navigation, raster/native/GPU accounting, and edit latency need separate interpretation. No original-project reproduction, production browser comparison, or GPU allocation breakdown is claimed. The PR should reference issue #38 without automatically closing it.

Both owned Mac browser sessions and their loopback CDP tunnels were closed; task temporary directories on the Mac were removed. Main services, origin/host guards, broker credentials, tickets, and Tailscale configuration were unchanged.
