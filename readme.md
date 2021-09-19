# MDCV
markdown to CV generator

this is a work in progress but already provides some reasonable results

you can run this with the following command:

```shell
npx https://github.com/eliotstocker/mdcv
```

or install with:
```shell
npm i https://github.com/eliotstocker/mdcv
# then you can run:
mdcv
```

## CLI Options

| switch | type | default | description |
| ------ | ---- | ------- | ----------- |
| -p, --path | string | ./ | path to the root of your CV markdown files |
| -o, --output | string | ./ | output director for CV PDF |
| -t, --theme | string | material | theme to use for building cv, either the name of a built in theme, or path to an external theme, currently you may use `material` or `simple` |
| --primaryColor | string | | the primary color to used for rendering the CV template, it is theme dependent how this is applied (if not set will default to theme colors) |
| --secondaryColor | string | | the secondary color to used for rendering the CV template, it is theme dependent how this is applied (if not set will default to theme colors) |
| -s, --scale | number | 0.7 | scale factor for rendering the document |
| --hide-generator | | | hide the "generated by MDCV" text |
|-d, --debug | | | boot the server only, and leave running to connect to from a web browser, does not generate a PDF |
|-h, --help | | | shows this help screen |

## Building a CV
to make a CV you simply need a directory including the following files and then run the mdcv command against it

### Required Files
* title.md - your name and maybe a sub header
* other.md - other info for instance hobbies etc.
* contact.md - your contact details
* references.md - information about your references
* employment - this should be a directory, each markdown file in here will be added as a previous employment in filename order (try adding images to your employment header for a more interesting output)

### Optional Files
* info.md - some info to put before your experience
* footer - some footer text for the end of the CV (or every page depending on the theme)