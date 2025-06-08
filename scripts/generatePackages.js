const fs = require('fs')
const path = require('path')

const rootPackageJson = require('../package.json')
const packagesDir = path.join(__dirname, '../src')

fs.readdirSync(packagesDir).forEach((dir) => {
    const packageTemplatePath = path.join(packagesDir, dir, 'package.template.json')
    if (fs.existsSync(packageTemplatePath)) {
        let packageTemplateJson = require(packageTemplatePath)
        packageTemplateJson = JSON.parse(
            JSON.stringify(packageTemplateJson).replaceAll('$DYNAMIC$', rootPackageJson.version)
        )
        const localDeps = packageTemplateJson.dependencies
        const localDevDeps = packageTemplateJson.devDependencies
        const globalDeps = rootPackageJson.dependencies
        const globalDevDeps = rootPackageJson.devDependencies

        delete packageTemplateJson.main
        delete packageTemplateJson.types

        if (localDeps) {
            Object.keys(localDeps).forEach((dep) => {
                if (globalDeps[dep]) {
                    packageTemplateJson.dependencies[dep] = globalDeps[dep]
                }
            })
        }

        if (localDevDeps) {
            Object.keys(localDevDeps).forEach((dep) => {
                if (globalDevDeps[dep]) {
                    packageTemplateJson.devDependencies[dep] = globalDevDeps[dep]
                }
            })
        }

        fs.writeFileSync(
            path.join(packagesDir, dir, 'package.json'),
            JSON.stringify(packageTemplateJson, null, 2)
        )
    }
})
