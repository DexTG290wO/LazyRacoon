# Lazy & the Little Raccoon

A small, cozy top-down pixel-art birthday adventure for Lazy.

## Run locally

ES modules require a local web server (opening `index.html` directly with `file://` will not work).

```bash
cd lazy-raccoon
python -m http.server 8000
```

Then open <http://localhost:8000> in a browser.

## Controls

- **WASD / Arrow keys** — move
- **E / Space** — interact / collect / talk
- **C** — open the wardrobe; choose an unlocked item with **1–7** or tap it
- **F** — toggle fullscreen for a larger, clearer view
- **E / Space** at the pond — fish; press again when the bobber bites
- **E / Space** in the flower garden — water the flowers
- **Tab** — toggle minimap
- **Esc / P** — pause
- **M** — mute
- On touch devices, an on-screen D-pad and ACT button appear.

## Goal

Follow the hint in the top-right corner, collect the five hidden treasures
(Pink Flower, Purple Flower, Golden Star, Blue Crystal, Special Ribbon),
then enter the birthday house for the surprise.

Progress is saved automatically in `localStorage`. Use **Restart** in the
pause menu to begin again.

Optional birthday activities include three treasure chests, a growing flower
garden, timing-based fishing, a cookie-stealing raccoon chase, sleepy idle
animations, accessory customization, and a hidden tree room. These do not
change the five-item birthday quest requirement.

## Lantern Street (Phố Đèn Lồng)

An optional night-time side area reached from the Whispering Woods path
(walk north from the boardwalk near the bunny). It has red paper lanterns,
sagging fairy lights, cobblestones and three friendly vendors: a fox lantern
maker, an owl musician and a cookie bear.

Side quest: find the **three red lanterns** the wind blew around the street,
then talk to the fox to relight it. The reward is a glowing bow accessory
and fireflies that follow the raccoon. This quest is completely optional —
the five treasures, the birthday house and the ending are unchanged.

## To explore

- **Forest Bunny** near the garden gives hints that change with your progress.
- Five wooden signs around the forest share local gossip and clues.
- **Flower Garden**, **Mirror Pond**, **Whispering Woods**, **Picnic Clearing**,
  **Fairy Ring** and **Ancient Stone Circle** each announce themselves when
  you first arrive.
- The birthday house has a padlock until all five treasures are found, then
  its door glows and warm light spills from the windows. Smoke drifts from
  the chimney.
- The minimap marks every uncollected treasure, the bunny and the house.
