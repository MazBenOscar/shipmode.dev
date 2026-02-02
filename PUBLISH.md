# Publishing ShipMode to NPM

## Pre-publish Checklist

1. ✅ Version set in `package.json` (currently 1.0.0)
2. ✅ `files` field includes: dist, bin, templates
3. ✅ `bin` commands: shipmode, ship
4. ✅ `prepublishOnly` script runs build
5. ✅ Tests pass
6. ✅ README.md present

## Publish Commands

```bash
# 1. Navigate to package
cd packages/shipmode

# 2. Clean install (no node_modules in package)
rm -rf node_modules
cd ../.. && npm install && cd packages/shipmode

# 3. Run final build
npm run build

# 4. Test one more time
npm run test:run

# 5. Login to npm (if not already)
npm login

# 6. Publish (public package)
npm publish --access public

# 7. Verify installation
npm info shipmode
```

## Post-Publish

Users can then install with:
```bash
npm install -g shipmode
shipmode --version
```

## Version Updates

For future updates:
```bash
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0
npm publish
```