# min-wage frame

min-wage frame was generated from [yeoman/generator-chrome-extension](https://github.com/yeoman/generator-chrome-extension).

Uses a fancy regex to find instances of money in the DOM and translate that into time spent working minimum wage. That's the core; there are preferences and such but those are relatively easy to grasp.

## Development
Load as an unpacked extension from `app/`, run `gulp watch`, and you're free to develop. Extension reloads only happen on javascript changes so html or manifest changes won't trigger a reload. If you save often enough to trigger a reload more than once every 10 seconds, the extension will eventually be disabled. Just reenable it and don't save so much.

Avoid editing `app/scripts` instead of `scripts.babel` as the latter will overwrite the former during development.