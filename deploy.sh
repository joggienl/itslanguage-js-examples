#!/usr/bin/env bash

set -e # Exit with nonzero exit code if anything fails

SOURCE_BRANCH="master"
TARGET_BRANCH="gh-pages"
if [ "$TRAVIS_PULL_REQUEST" != "false" ]; then
    echo "Skipping deploy; just doing a build."
    exit 0
fi
# Save some useful information
REPO=`git config remote.origin.url`
SSH_REPO=${REPO/https:\/\/github.com\//git@github.com:}

SHA=`git rev-parse --verify HEAD`

git remote set-url origin ${SSH_REPO}
git config user.name "Travis CI"
git config user.email "$COMMIT_AUTHOR_EMAIL"

ENCRYPTED_KEY_VAR="encrypted_${ENCRYPTION_LABEL}_key"
ENCRYPTED_IV_VAR="encrypted_${ENCRYPTION_LABEL}_iv"
ENCRYPTED_KEY=${!ENCRYPTED_KEY_VAR}
ENCRYPTED_IV=${!ENCRYPTED_IV_VAR}
openssl aes-256-cbc -K ${ENCRYPTED_KEY} -iv ${ENCRYPTED_IV} -in itsl_example_deploy_key.enc -out itsl_example_deploy_key -d
chmod 600 itsl_example_deploy_key
eval `ssh-agent -s`
ssh-add itsl_example_deploy_key

npm run build

cd dist
git checkout gh-pages index.html
cd ..

git add dist/
git commit -m "Deploy to GitHub Pages: ${SHA}"

git subtree split --prefix dist/ -b gh-pages
git push -f origin gh-pages:gh-pages
