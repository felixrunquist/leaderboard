const fs = require('fs')
const { program } = require('commander');
//Create new component in /components with name provided by ...
// print process.argv
// process.argv.forEach(function (val, index, array) {
//   console.log(index + ': ' + val);
// });

// console.info
const VERSION = 0.1

var config = {dir: 'components/'}

program
  .version(VERSION)
  .arguments('<componentName>')
  // .option(
  //   '-l, --lang <language>',
  //   'Which language to use (default: "js")',
  //   /^(js|ts)$/i,
  //   config.lang
  // )
  .option(
    '-d, --dir <pathToDirectory>',
    'Path to the "components" directory (default: "/components")',
  )
  .option(
    '-f, --foldername <folderName>',
    'Folder name if differs from component name (default: same as component name)',
  )
  .parse(process.argv);

var {dir, foldername} = program.opts();
// console.log(program.opts())
// console.log(dir)
// console.log(foldername)
const [componentName] = program.args;
if(typeof dir != 'undefined'){
  config.dir = dir
}
if(typeof foldername == 'undefined'){
  foldername = componentName
}

console.info('Component creator V' + VERSION)
console.info('Component name: ' + componentName)
const path = process.env.PWD + '/' + config.dir + foldername + '/'
console.info('Creating boilerplate component at ' + path)

fs.mkdirSync(path)
fs.writeFileSync(path + 'index.js', `export { default } from './${foldername}';`)
fs.writeFileSync(path + foldername + '.js', `
import styles from './${foldername}.module.scss';
import { useEffect, useState, useRef } from 'react'

export default function ${componentName}(props){
  return (
    <>
    </>
  )
}
`)

fs.writeFileSync(path + foldername + '.module.scss', '')

// console.log(process.env.PWD)
