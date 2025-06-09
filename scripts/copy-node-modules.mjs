/*
 This script is used in the Docker build to copy only the used docker files
*/
import fs from 'fs'
import { dirname } from 'path'

//Remove existing node_modules
fs.rmSync('./.next/standalone/node_modules', { recursive: true, force: true })
fs.mkdirSync('./.next/standalone/node_modules')

const rejectModules = ['sass', 'caniuse-lite', 'color', 'color-convert', 'color-name', 'color-string', 'sharp'] // Modules that should be ignored

//Load JSON
const text = fs.readFileSync('./.next/next-server.js.nft.json')
const json = JSON.parse(text)
json.files.forEach(f => {
    if(!f.includes('../node_modules')){
        return;
    }
    for(const module of rejectModules){
        if(f.includes('node_modules/' + module)){
            return;
        }
    }
    console.log(f)
    const ext = f.replace('../node_modules/', '')
    const dest = './.next/standalone/node_modules/' + ext

    fs.mkdirSync(dirname(dest), {recursive: true})
    fs.copyFileSync('./node_modules/' + ext, dest)
})