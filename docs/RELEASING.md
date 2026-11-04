# Releasing the Android app

Pushing a version tag builds a signed release APK on GitHub Actions and
publishes it as a GitHub Release
([`.github/workflows/release-android.yml`](../.github/workflows/release-android.yml)).
The APK is signed with the same key as every earlier release, so it installs over
them and keeps users' data.

## One-time setup: add your signing key as secrets

Use the keystore you already sign releases with. The values are in your local
`android/keystore.properties`. **Never generate a new key for an app people have
installed.** An APK signed with a different key won't install over the old one, and
the only way around that is uninstalling, which wipes all local data.

1. Base64-encode the keystore file:

   macOS:

   ```bash
   base64 -i path/to/release.jks | tr -d '\n' > keystore.b64
   ```

   Linux:

   ```bash
   base64 -w0 path/to/release.jks > keystore.b64
   ```

   Windows (PowerShell):

   ```powershell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("path\to\release.jks")) | Set-Content keystore.b64
   ```

2. On GitHub, go to **Settings → Secrets and variables → Actions → New repository
   secret** and add:

   | Secret | Value |
   |---|---|
   | `ANDROID_KEYSTORE_BASE64` | contents of `keystore.b64` |
   | `ANDROID_KEYSTORE_PASSWORD` | `storePassword` from `keystore.properties` |
   | `ANDROID_KEY_ALIAS` | `keyAlias` |
   | `ANDROID_KEY_PASSWORD` | `keyPassword` |
   | `ANDROID_CERT_SHA256` *(optional, recommended)* | the signing certificate's SHA-256 fingerprint (see below) |

   With the GitHub CLI instead:

   ```bash
   gh secret set ANDROID_KEYSTORE_BASE64 < keystore.b64
   ```

   ```bash
   gh secret set ANDROID_KEYSTORE_PASSWORD
   ```

   ```bash
   gh secret set ANDROID_KEY_ALIAS
   ```

   ```bash
   gh secret set ANDROID_KEY_PASSWORD
   ```

   Each of the last three asks you to type its value.

3. Delete `keystore.b64` afterwards. Keep the `.jks` file backed up somewhere safe
   outside the repo; it's already gitignored.

`ANDROID_CERT_SHA256` makes the workflow refuse to publish if the APK was signed with
any other key. Get the fingerprint from your keystore (enter the store password when
asked):

```bash
keytool -list -v -keystore path/to/release.jks -alias YOUR_ALIAS | grep SHA256
```

Or get it from the last published APK, with Android build-tools installed:

```bash
apksigner verify --print-certs Zenith-v1.4.0.apk | grep SHA-256
```

Colons and letter case don't matter.

## Cutting a release

1. Bump the version everywhere to the same value (the workflow checks this):
   - `package.json`: run `npm version 1.6.0 --no-git-tag-version`.
   - `android/app/build.gradle`: `versionName "1.6.0"`, and increase `versionCode` by 1.
   - `ios/App/App.xcodeproj/project.pbxproj`: `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION`.
2. Add a `## [1.6.0] - YYYY-MM-DD` section to `CHANGELOG.md`.
3. Optionally write user-facing notes in `docs/release-notes/v1.6.0.md`. If that file
   exists it becomes the release text; otherwise the CHANGELOG section is used. The
   workflow adds the install line itself.
4. Merge to `main`, then tag that commit and push the tag:

   ```bash
   git checkout main && git pull
   ```

   ```bash
   git tag v1.6.0 && git push origin v1.6.0
   ```

The **Release Android APK** run then:

1. checks that the tag, `versionName` and `package.json` agree, and that release
   notes exist;
2. runs the typecheck, tests and web build;
3. builds and signs the APK and verifies the signature (and the fingerprint, if set);
4. publishes `Zenith-v1.6.0.apk` and its `.sha256` file under **Releases**.

To rebuild an existing tag (for example after fixing a secret), go to **Actions →
Release Android APK → Run workflow** and enter the tag. If the release already exists,
its files are replaced and its notes are left as they are.

## iOS

Not automated. Signing needs an Apple developer account and a Mac, so iOS builds still
go through `npm run ios` (Xcode).
