# veritone-sample-app-netlify

Welcome to the Veritone sample app! See the live app at: https://veritone-sample-app.netlify.com

## What Is It?
A simple web page to demonstrate integration with Veritone Developer framework. The app shows how to authenticate to the Veritone platform; integrate with the Veritone CMS; and use API methods to carry out AI operations (such as Object Detection) on media files.

## How Do You Build It?

Actually, there is no "build" per se, since the code is plain vanilla JS+HTML+CSS. You just need to deploy the `index.html` file, along with the `styles.css` file, and the `scripts/utils.js` file, to your own server. Or, deploy the files to a CDN using Netlify.

The easiest way to deploy a live site is probably to use Netlify. The procedure is:

1. First, create your own version of this repository, either by cloning this instance locally and then doing a mirror-push of it to your own repo; or by forking it or importing it into your own Github repo.

2. Get a free account at https://www.netlify.com/. Then point Netlify to your repo (follow the instructions in the Netlify UI) and have Netlify build and deploy your repo as a static site. 

We have included, in this repository, the various files (such as yarn.lock, package.json, etc.) that Netlify will look for when building your site. You do not need a local install of yarn (nor Node, nor anything else). Netlify should be able to build the site "as is."

## Documentation
For more info, see https://docs.veritone.com/#/developer/applications/app-tutorial/.

## License
Copyright 2019, Veritone Inc.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
