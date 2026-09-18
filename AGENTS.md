# Persistent Project Instructions for LithoScale Pro

## Critical Asset Protection Rules
1. **STRICT ASSET PRESERVATION**:
   - The AI MUST NEVER create, overwrite, modify, replace, or delete any image or asset files in the `public/` directory (e.g. `apple-touch-icon.png`, `favicon.*`, logos, stone images, icons).
   - All assets in `public/` are user-managed assets and must be treated as strictly READ-ONLY.
   - Never generate AI placeholder icons, favicons, or mock SVGs in `public/`.
   - Never touch existing image references in code unless explicitly requested by the user.

2. **Logo & Asset Paths**:
   - Keep the logo reference strictly pointing to `/apple-touch-icon.png`.
   - Do not alter or wrap the logo rendering in Navigation or Login components.
