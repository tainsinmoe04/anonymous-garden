# Visual spec and asset provenance

User-approved direction: clear blue daytime sky, an apparently endless flower garden, detailed foreground flowers, gentle motion, minimal UI, and Share/Listen at a corner. The user accepted the generated concept and requested transparent glass buttons with visible borders. Moonlit Lofi was inspected as a reference for clarity and visual emphasis, without copying its music features.

## Design system

- Full-bleed viewport canvas; quiet header top left, language top right; actions bottom right; list/privacy/motion utilities bottom left.
- Ink #164b58; secondary text #526e72; panel white #ffffff; accent #285d65; subtle border #dce5e1.
- Glass buttons: translucent white/deep teal, 1px translucent white border, 18px backdrop blur, 40px radius. User-requested change from opaque concept buttons.
- Utilities use a small dark glass backing to keep white labels readable over white petals; this is an intentional accessibility addition to the concept. Localized copy and this backing are the only additional default-screen text/chrome families.
- Display: Cormorant Garamond. Myanmar/body/UI: Noto Sans Myanmar. Both served from npm font assets, no Google Fonts requests.
- Headline at roughly 32% height with open sky around it. No marketing sections or decorative cards. Native dialog sheets are used only for the required journeys.
- Mobile: stacked utility/action rows, bottom-right actions, portrait image crop, nearly full-height sheets. All content stays reachable through list view.
- Motion: anchored flower sway, extremely slow background drift; pause and reduced-motion support. Scene animation stops while a dialog is open.

## Above-the-fold copy

Working name: Anonymous Garden. Language: မြန်မာ / EN. Headline: “Every story deserves to be heard.” / “စကားတိုင်းအတွက် နားထောင်ပေးမယ့်နေရာ။” Support: “A little room to pause. A place to be yourself.” / “ဒီပန်းခင်းလေးမှာ ခဏနားလို့ရပါတယ်။” Actions: Share a story / Listen to a story and ရင်ဖွင့်မယ် / နားထောင်မယ်. Utilities: List view, Privacy & care, flower-motion control, and an explicit mock-data label. These localized/functional additions are intentional departures from the generated image's garbled Burmese subtitle.

## Assets

All three images were generated with the built-in Image Gen tool, not an external CLI/API key.

1. `garden-concept.png`: full primary-screen concept. Brief: full-bleed clear pale-blue sky, wispy white clouds, endless meadow with ivory lilies, white/yellow daisies, blue forget-me-nots, lavender, blush camellias; realistic soft sunlight; detailed foreground petals and leaves; quiet wordmark and corner buttons; no dashboards, badges, metrics, people, buildings, or extra features.
2. `../public/garden.webp`: production background edited from the inspected concept. Final prompt: “Remove ALL text, logo, buttons, icons, UI and labels, reconstruct natural background beneath. Preserve the same clear brilliant blue sky, wispy cumulus clouds, endless flower meadow, lighting, camera composition and photorealistic stylized flower quality. Keep all flowers and their position. No typography anywhere. This will be a full-bleed background behind code-native controls and actual animated 3D foreground flowers. Landscape 1536x1024. Do not add any interface or watermark.”
3. `../public/flowers.webp`: transparent botanical cutout generated using the background as a reference. Final brief: six naturally grouped sunlit flowers with long stems—large open ivory lily, two white/yellow daisies, blush camellia, blue forget-me-not spray, lavender—with detailed realistic petals and leaves. True alpha, low eye-level front view, upper-left morning light, no clipping, vase, floor, UI, text, clay or low-poly forms. Alpha was preserved during WebP conversion.

The foreground is intentionally implemented as layered 2.5D curved textured meshes rather than complete sculpted models. That remaining difference from the requested full 3D experience must be communicated rather than claimed complete.

Depth refinement: 13 small atmospheric moving botanical layers on desktop, 7 on mobile, behind the existing foreground. Seven celebration petals use three sizes and landing depths; reduced-motion and pause behavior remain supported.

Additional density: two rows of botanical cutouts (18 mobile, 32 desktop) with more visible wind. Five mobile/nine desktop small flowers use instanced 3D petals that unfold once in staggered six-second blooms. Photographic foreground flowers remain textured 2.5D; unfolding is limited to the supplemental modeled flowers. Pausing freezes both wind and bloom; an initially reduced-motion scene shows open blooms.

Interaction refinement: five small modeled flowers start upright and partly closed, open monotonically on tap/click (or the keyboard bloom action), and stay open for the session. Eight gentle light motes orbit each bloom at rest; the selected flower gathers up to 32 for six seconds. Approved encouragement also opens one flower and concentrates its motes. Public story reading remains available through Listen. Motion controls freeze the scene, with static opening under reduced motion.

Latest direction (supersedes bloom experiments above): remove all standalone modeled flowers and petal-opening behavior. Ambient light motes now drift among the existing textured moving flower layers in a single point cloud. A tap concentrates a brief glow at the actual hit position. Approved encouragement still creates falling petals and a local light gathering. Mobile flower opacity is restored to full, atmospheric wash reduced, texture anisotropy enabled, and DPR capped at 2 for clearer petals.
