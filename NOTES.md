# Notes

## Priority and improvement

The extra effort went into **import trust**: an immutable source fingerprint, preserved per-comment source HTML, count receipt, and visible warnings. A company with four years invested in a template needs evidence that their language survived more than they need a flashy editor.

## Checks performed

- TypeScript type check completed successfully. The committed sample is designed to produce 3 sections, 6 items, and 7 comments; re-run the parser smoke check locally after installing dependencies if needed.
- Import flow rejects empty/non-semantic HTML with a clear error.
- The API writes normalized records in one database create, reloads them via `GET /api/templates/:id`, and duplicate creates new records instead of sharing IDs.
- The UI intentionally retains unsaved edits after a failed save.

## Failure case

Uploading a PDF, a blank HTML file, or a regular report with no supported blocks returns a 422 with guidance to use the HTML-text template export. Embedded tables/media are retained only where valid in a comment and produce a visible warning.

## Cuts

Rich-text editing and exact source diff were cut to preserve a reliable import/edit/copy/persistence baseline in the timebox. Authentication, report writing, scheduling, and homeowner views are deliberately out of scope.

## Approximate time

About two focused days, including product exploration, schema/design, implementation, test pass, and walkthrough preparation. No external starter code was used; framework and ORM documentation informed the setup.
