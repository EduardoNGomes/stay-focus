# Project guidance

Read `plan.md` and the relevant `.features/` file before implementing a feature. The English and Portuguese sections of the plan describe the same approved scope; preserve both when changing product decisions.

Follow the numbered feature order and listed dependencies unless the user changes priorities. Keep the MDO Design System at `/home/rookie/Projects/mdo-design-system` as the visual reference. The approved Hardcore behavior is an in-app lock during the active window; disabling or removing the extension through Chrome stops blocking.

Update a checkbox only after its deliverable has been implemented and verified. Leave partial work unchecked and describe it clearly. Record any proposed scope or plan change in `plan.md` for user review before treating it as approved.

No build or package command is needed for the plain JavaScript extension. Run `npm test` for automated behavior checks, `python3 -m json.tool manifest.json` for the manifest, and `for file in src/*.js; do node --check "$file" || exit; done` for JavaScript syntax. Browser verification should include loading the unpacked project root in Chrome and checking the scenarios in `README.md` and `plan.md`.
