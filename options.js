module.exports = [
    {
        name: 'path',
        alias: 'p',
        type: String,
        defaultOption: true,
        defaultValue: './',
        description: 'path to the root of your CV markdown files'
    },
    {
        name: 'output',
        alias: 'o',
        type: String,
        defaultValue: './',
        description: 'output director for CV PDF'
    },
    {
        name: 'theme',
        alias: 't',
        type: String,
        defaultValue: 'material',
        description: 'theme to use for building cv, either the name of a built in theme, or path to an external theme'
    },
    {
        name: 'primaryColor',
        type: String,
        description: 'the primary color to used for rendering the CV template, {bold it is theme dependent how this is applied} (if not set will default to theme colors)'
    },
    {
        name: 'secondaryColor',
        type: String,
        description: 'the secondary color to used for rendering the CV template, {bold it is theme dependent how this is applied} (if not set will default to theme colors)'
    },
    {
        name: 'scale',
        alias: 's',
        type: Number,
        defaultValue: 0.7,
        description: 'scale factor for rendering the document'
    },
    {
        name: 'hide-profile-image',
        type: Boolean,
        description: 'do not display profile image'
    },
    {
        name: 'hide-generator',
        type: Boolean,
        description: 'hide the "generated by MDCV" text'
    },
    {
        name: 'debug',
        alias: 'd',
        type: Boolean,
        description: 'boot the server only, and leave running to connect to from a web browser, {bold does not generate a PDF}'
    },
    {
        name: 'help',
        alias: 'h',
        type: Boolean,
        description: 'shows this help screen'
    }
]