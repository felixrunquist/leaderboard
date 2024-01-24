This is a customized [Next.js](https://nextjs.org/) project. After noticing that I always start with the same commands when starting a new Next.js project, I decided to create a boilerplate of my own.

It has special features such as sass support and custom file paths. I use it personally as a boilerplate for my Next.js projects, and am very opinionated with what I include in it, but feel free to use it if it works for you to!

## Features
- [Sass](https://sass-lang.com/) support in global and modular stylesheets.
- Custom file paths, such as `@/l/` which maps to `/lib` (This can be modified in `jsconfig.json`)
- A component creator, which will create a folder with the component name as well as a stylesheet. To create a new component, run `node new-component.js [component name]`.
- Custom media queries. In the `globals.scss` are defined custom includes for different breakpoints. This is great for building responsive layout as it makes breakpoints easier to use in modules, you can use them like so:
```
@import 'styles/constants.scss';

.element {width: 100%; } // Default width for an element (for mobile)

@include bp(md){
  .element {width: 80%; } // Width on devices wider than 768px
}

@include bp(lg){
  .element {width: 60%; } // Width on devices wider than 1024px
}

@include bp(xl){
  .element {width: 50%; } // Width on devices wider than 1280px
}

```

## What I don't use
- CSS frameworks such as Tailwind. I find that this only shifts the CSS issue to the `class` attribute, and you end up with extremely long strings like `bg-slate-900 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 text-white font-semibold h-12 px-6 rounded-lg w-full flex items-center justify-center sm:w-auto dark:bg-sky-500 dark:highlight-white/20 dark:hover:bg-sky-400` (Case in point: the [Tailwind](https://tailwindcss.com/) website). [This article](https://www.smashingmagazine.com/2022/05/you-dont-need-ui-framework/) summarises the problem extremely well.
- TypeScript. I've never been a fan of typing in JS, and even though it may definitely save time fixing errors for certain people, I feel like JavaScript was never made for this. Who knows, maybe my opinion will change.

## Getting started

First, clone the project locally using `git clone`.

Next, run `yarn install` to add dependencies.

Then, run the development server:

```bash
yarn run dev
```.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Deploy on Vercel

The easiest way to deploy is to use the [Vercel Platform](https://vercel.com/new) from the creators of Next.js.
