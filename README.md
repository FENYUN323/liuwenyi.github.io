# Wenyi Liu — Personal Academic Website

This repository contains the Jekyll source for Wenyi Liu's academic website:

<https://FENYUN323.github.io/liuwenyi.github.io/>

The site is based on Academic Pages / Minimal Mistakes and is configured for:

- local preview in Visual Studio Code;
- automatic build checks for pull requests;
- automatic deployment to GitHub Pages after pushes to `main`.

## Content map

| Content | File or directory |
| --- | --- |
| Site title, author profile and social links | `_config.yml` |
| Top navigation | `_data/navigation.yml` |
| English home page | `_pages/about.md` |
| Chinese introduction | `_pages/chinese.md` |
| Publications | `_pages/publications.md` |
| Web CV | `_pages/cv.md` |
| Research projects | `_portfolio/` |
| Teaching experience | `_teaching/` |
| Profile photo | `images/profile.jpg` |
| Colors and typography | `_sass/_variables.scss` |

## Preview in Visual Studio Code on Windows

### Prerequisites

Install a 64-bit **Ruby+Devkit** distribution from <https://rubyinstaller.org/downloads/>. During installation, add Ruby to `PATH` and install the MSYS2/MINGW development toolchain when prompted by `ridk install`.

Restart Visual Studio Code after installing Ruby, then confirm the toolchain in a new integrated terminal:

```powershell
ruby -v
gem -v
bundle -v
```

If `bundle` is unavailable, install it once:

```powershell
gem install bundler
```

### One-time setup

1. Open this repository as a folder in Visual Studio Code.
2. Press `Ctrl+Shift+P` and run **Tasks: Run Task**.
3. Select **Jekyll: Install dependencies** and wait for it to finish.

### Preview with one key

Press `F5` and choose **Jekyll: Preview in VS Code** if prompted. VS Code starts Jekyll and opens <http://127.0.0.1:4000/> in its integrated browser.

You can also press `Ctrl+Shift+P`, run **Tasks: Run Task**, and choose **Jekyll: Serve**. When the terminal prints `Server running`, open the localhost link or run **Browser: Open Integrated Browser** manually.

Markdown, HTML and Sass changes are rebuilt automatically. Changes to `_config.yml` require stopping the task and starting it again.

Equivalent terminal commands are:

```powershell
bundle install
bundle exec jekyll serve --livereload --host 127.0.0.1 --port 4000 --baseurl ""
```

Run `Ctrl+Shift+B` to perform a production build. Generated files are written to `_site/` and are not committed.

## Publish with GitHub Pages

The workflow in `.github/workflows/pages.yml` builds and deploys the site automatically.

### First-time GitHub setup

1. Use the `FENYUN323/liuwenyi.github.io` repository.
2. Push the complete contents of this folder to the repository's `main` branch.
3. On GitHub, open **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to **GitHub Actions**.
5. Open the **Actions** tab and wait for **Build and deploy GitHub Pages** to finish.
6. Visit <https://FENYUN323.github.io/liuwenyi.github.io/>.

After this initial setup, every push to `main` automatically rebuilds the public site. Pull requests run the Jekyll build as a check but do not deploy.

If the GitHub username or repository name changes, update `url` and `repository` in `_config.yml`, the site URL in this README, and the repository name used above.

## Routine updates

- Replace `images/profile.jpg` to update the profile photo while keeping the same filename.
- Edit `_pages/publications.md` when adding a publication.
- Add or edit Markdown files in `_portfolio/` for research projects.
- Run the local production build before pushing significant changes.

Do not use the VS Code Live Server extension for the source directory: Jekyll must first process Liquid templates, Markdown, collections and Sass.
