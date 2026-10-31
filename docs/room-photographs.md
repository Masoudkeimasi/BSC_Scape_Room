# Room photographs

All six images were supplied by the user in `page 6.zip`. The original files are copied unchanged into `public/images/` and served locally. There are no external image requests or Wikimedia dependencies. No photographer or license metadata was included; being supplied by the game designer is not a claim that they photographed the images.

| Room                                | Local file    | Original filename | Subject                                     |
| ----------------------------------- | ------------- | ----------------- | ------------------------------------------- |
| 1 — Vision Vault                    | `room-1.webp` | `Page 1.webp`     | Terrace reliefs and columns beneath clouds  |
| 2 — Financial Vault                 | `room-2.jpg`  | `Page 2.jpg`      | Tall columns under a clear blue sky         |
| 3 — Customer Vault                  | `room-3.webp` | `Page 3.webp`     | Gate of All Nations and the walkway         |
| 4 — Internal Business Process Vault | `room-4.jpg`  | `page 3.jpg`      | A different view of the Gate of All Nations |
| 5 — Learning and Growth Vault       | `room-5.jpg`  | `page 5.jpg`      | Column base and stone guardian              |
| 6 — Knowledge Vault                 | `room-6.webp` | `page 6.webp`     | Paired griffin capitals in warm light       |

The archive contains two different Page 3 images and no Page 4 image. The additional Page 3 image is assigned to Room 4 so every photograph appears on a different room page.

`room-photographs.json` records original filenames and SHA-256 checksums. `src/lib/page-themes.ts` controls each photograph and its crop position. CSS gradients protect the room title's contrast; activity cards are opaque. The photographs are decorative backgrounds rather than redundant screen-reader content.
