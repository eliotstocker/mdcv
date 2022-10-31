#!/usr/bin/env node

const {spawn} = require('child_process');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');

const chalk = require('chalk');
const puppeteer = require('puppeteer');

const cla = require('command-line-args');
const clu = require('command-line-usage');
const options = require('./options');

const opts = cla(options);

if (opts.help) {
    showHelp();
}

const dir = path.resolve(opts.path);
const outputDir = path.resolve(opts.output);
const theme = opts.theme;
const debug = opts.debug;
const scaling = opts.scale;

function showHelp(err) {
    const error = err ? [{
        header: 'Error',
        content: `{redBright ${err.message || err}}`
    }] : [];
    const sections = [
        {
            header: 'MDCV',
            content: 'generate a PDF CV from markdown files {underline WIP}'
        },
        ...error,
        {
            header: 'Options',
            optionList: options
        }
    ];

    console.log(clu(sections));
    process.exit(err ? 1 : 0);
}

function checkRequiredFiles() {
    const required = ['title', 'other', 'contact', 'references'];
    const optional = ['info', 'footer'];

    try {
        fs.accessSync(path.resolve(dir, 'employment'), fs.F_OK);
    } catch (e) {
        throw new Error(`Missing required 'employment' directory`);
    }

    const missingRequired = required.filter(name => {
        try {
            fs.accessSync(path.resolve(dir, `${name}.md`), fs.F_OK);
            return false; //not missing
        } catch (e) {
            return true; //missing
        }
    });

    if(missingRequired.length > 0) {
        throw new Error(`Missing required Markdown files: ${missingRequired.join(', ')}`);
    }

    const missingOptional = optional.filter(name => {
        try {
            fs.accessSync(path.resolve(dir, `${name}.md`), fs.F_OK);
            return false; //not missing
        } catch (e) {
            return true; //missing
        }
    });

    if(missingOptional.length > 0) {
        console.error(`${chalk.yellowBright('Warning |')} Missing optional content: ${missingOptional.join(', ')}`);
    }
}

const checkRequiredFilesPromise = () => Promise.resolve().then(() => checkRequiredFiles());

function generateTemplates() {
    const employmentPath = path.resolve(dir, 'employment');

    return fs.promises.mkdtemp(path.join(os.tmpdir(), 'mdcv-imports-'))
        .then(d =>
            fs.promises.readdir(employmentPath)
                .then(files => files.filter(path => path.split('.')[1].toLowerCase() == 'md'))
                .then(files => files.map(path => 'employment/' + path.split('.')[0]))
                .then(files => files.map(md => `<div class="employment"><sergey-import src="${md}" as="markdown"/></div>`))
                .then(lines => lines.join('\n'))
                .then(tplData => fs.promises.writeFile(path.join(d, 'employment.html'), tplData))
                .then(() => d)
        );
}

function copyTemplates() {
    return fs.promises.mkdtemp(path.join(os.tmpdir(), 'mdcv-template-'))
        .then(d =>
            fs.copy(path.resolve(__dirname, 'template'), d)
                .then(() => setupTheme(theme, d))
                .then(() => generateSpecStyle(opts, d))
                .then(() => d)
        );
}

function setupTheme(theme, dir) {
    let themePath = path.resolve(dir, 'styles/themes', theme);
    if(theme.includes('/')) {
        themePath = path.resolve(theme);
    }

    try {
        fs.accessSync(path.resolve(themePath, 'theme.css'), fs.F_OK);
    } catch (e) {
        throw new Error(`Theme: ${theme} not found`);
    }

    return fs.copy(path.resolve(themePath, 'theme.css'), path.resolve(dir, 'styles/theme.css'))
        .then(() => fs.remove(path.resolve(dir, 'styles/themes/')));
}

function generateSpecStyle({
                               primaryColor: primary,
                               secondaryColor: secondary,
                               'hide-generator': noGen,
                               'hide-profile-image': noImage
                           }, themeDir) {
    const optional = ['info', 'footer'];
    let specText = ':root {\n';
    if(primary) {
        specText += `--mainColor: #${primary};\n`;
        const [ph,ps,pl] = hexToHSL(primary);
        specText += `--mainColorDark: hsl(${ph}deg, ${ps}%, ${pl - 10}%);\n`;
    }

    if(secondary) {
        specText += `--secondaryColor: #${secondary};\n`;
        const [sh,ss,sl] = hexToHSL(secondary);
        specText += `--secondaryColorDark: hsl(${sh}deg, ${ss}%, ${sl - 10}%);\n`
    }

    if(noGen) {
        specText += '--generatorDisplay: none;\n';
    }

    if(noImage) {
        specText += '--imageDisplay: none;\n'
    }

    const missingOptional = optional.filter(name => {
        try {
            fs.accessSync(path.resolve(dir, `${name}.md`), fs.F_OK);
            return false; //not missing
        } catch (e) {
            return true; //missing
        }
    });

    specText += missingOptional.map(file => `--${file}Display: none;`).join('\n');
    specText += '}'

    return fs.promises.writeFile(path.resolve(themeDir, 'styles', 'spec.css'), specText);
}

function hexToHSL(hex) {
    let r = parseInt(hex.slice(0, 2), 16),
        g = parseInt(hex.slice(2, 4), 16),
        b = parseInt(hex.slice(4, 6), 16);

    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; // achromatic
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h * 360, s * 100, l * 100];
}

function copyMedia(tmpTemplate) {
    return fs.copy(dir, tmpTemplate, {
        filter: (src) => {
            return !src.endsWith('.md')
        }
    })
}

function copyContent() {
    return fs.promises.mkdtemp(path.join(os.tmpdir(), 'mdcv-content-'))
        .then(d =>
            fs.copy(dir, d, {
                filter: (src) => {
                    return !src.split('/').pop().includes('.') || src.endsWith('.md')
                }
            })
            .then(() => d)
    )
}

function deleteTempDirectories(dirs) {
    return Promise.all(dirs.map(dir => fs.remove(dir)));
}

function startServer(templatePath, importsPath, contentPath) {
    return fs.promises.mkdtemp(path.join(os.tmpdir(), 'mdcv-public-'))
        .then(tmpPublic => {
            const sergeyPath = require.resolve('sergey');
            const imports = path.relative(templatePath, importsPath);
            const content =  path.relative(templatePath, contentPath);
            const output = path.relative(templatePath, tmpPublic);

            const sergeyInstance = spawn(sergeyPath, [
                `--watch`,
                `--imports=${imports}`,
                `--output=${output}`,
                `--content=${content}`
            ], {
                cwd: templatePath
            });

            return new Promise(resolve => {
                sergeyInstance.stdout.on('data', d => {
                    if (d.toString().startsWith('Sergey running on http://')) {
                        const address = d.toString().split('http://')[1];

                        if(!debug) {
                            generate(address)
                                .then(() => deleteTempDirectories([
                                    templatePath,
                                    contentPath,
                                    importsPath,
                                    tmpPublic
                                ]))
                                .then(() => sergeyInstance.kill())
                                .then(resolve);
                        } else {
                            console.log(`${chalk.blueBright('Sergey |')} ${d.toString()}`);
                            
                            console.log(`${chalk.redBright('Debug |')} Temp files at: ${tmpPublic}`)
                            process.on('SIGINT', function() {
                                deleteTempDirectories([
                                    templatePath,
                                    contentPath,
                                    importsPath,
                                    tmpPublic
                                ])
                                .then(() => sergeyInstance.kill())
                                .then(resolve);
                            });
                        }
                    } else {
                        console.log(`${chalk.blueBright('Sergey |')} ${d.toString()}`);
                    }
                });

                sergeyInstance.stderr.on('data', d => {
                    console.error(`${chalk.blueBright('Sergey |')} ${chalk.red('Error:')} ${d.toString()}`);
                });
            });
        });
}

function generate(address) {
    console.log(`${chalk.greenBright('Puppeteer |')} Starting PDF generation...`);
    return puppeteer.launch()
        .then(browser => browser.newPage()
            .then(page => page.goto(`http://${address}`)
                .then(() => page.pdf({
                    path: `${outputDir}/cv.pdf`,
                    format: 'A4',
                    scale: scaling,
                    printBackground: true,
                    displayHeaderFooter: true
                }))
                .then(() => browser.close())
            )
        )
        .then(() => console.log(`${chalk.greenBright('Puppeteer |')} PDF saved`))
}

checkRequiredFilesPromise()
    .then(Promise.all([
        copyTemplates(),
        generateTemplates(),
        copyContent()
    ])
    .then(([tpl, imports, content]) =>
        copyMedia(tpl)
            .then(() => startServer(tpl, imports, content)))
    )
    .catch(showHelp);