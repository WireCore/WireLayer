---
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-css': minor
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
'@wirecore/wirelayer-native': minor
---

Countdown: `format="clock"` shows the time as a clock – "05:12:33" instead of "05 Hrs 12 Min 33 Sec". The units stay
for screen readers (`sr-only`; on iOS and Android the timer reads its value text as before), the colons are hidden from
them. With `variant="boxed"` one box surrounds the whole clock. New recipe variant `format` and slot `separator`; story
_Clock_ in every Storybook.
