import { readdir, stat } from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process'; 

const JS_EXTENSIONS = ['.js', '.mjs', '.cjs'];
const IGNORE_DIRS = ['node_modules', '.git', '.vscode', '.idea']; 

let filesChecked = 0;
let errorCount = 0;

async function checkSyntaxInFile(filePath) {
    filesChecked++;
    process.stdout.write(`\rChecking: ${filePath.padEnd(80)}`);

    return new Promise((resolve) => {
        const nodeProcess = spawn(process.execPath, ['--check', filePath], {
            stdio: ['ignore', 'pipe', 'pipe'] 
        });

        let stderrData = '';
        nodeProcess.stderr.on('data', (data) => {
            stderrData += data.toString();
        });

        nodeProcess.on('close', (code) => {
            if (code !== 0) {
                errorCount++;
                process.stdout.write('\r' + ' '.repeat(90) + '\r'); 
                console.error(`\n❌ Syntax Error in ${filePath}:`);
                
                console.error(stderrData.trim());
                console.log('---');
            }
            resolve();
        });

        nodeProcess.on('error', (err) => {
            
            errorCount++;
            process.stdout.write('\r' + ' '.repeat(90) + '\r');
            console.error(`\n🚨 Failed to spawn node --check for ${filePath}:`);
            console.error(err.message);
            console.log('---');
            resolve(); 
        });
    });
}

async function scanDirectory(dirPath) {
    try {
        const entries = await readdir(dirPath);

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry);

            try {
                const stats = await stat(fullPath);

                if (stats.isDirectory()) {
                    if (IGNORE_DIRS.includes(entry)) {
                        continue;
                    }
                    await scanDirectory(fullPath);
                } else if (stats.isFile()) {
                    const ext = path.extname(fullPath).toLowerCase();
                    if (JS_EXTENSIONS.includes(ext)) {
                        await checkSyntaxInFile(fullPath);
                    }
                }
            } catch (statErr) {
                process.stdout.write('\r' + ' '.repeat(90) + '\r');
                console.warn(`\n⚠️  Could not stat ${fullPath}: ${statErr.message}`);
            }
        }
    } catch (readDirErr) {
        process.stdout.write('\r' + ' '.repeat(90) + '\r');
        console.error(`\n‼️  Could not read directory ${dirPath}: ${readDirErr.message}`);
    }
}

async function main() {
    const targetDir = process.argv[2] || process.cwd();
    const absoluteTargetDir = path.resolve(targetDir);

    console.log(`🚀 Starting syntax check in: ${absoluteTargetDir}`);
    console.log(`Ignoring directories: ${IGNORE_DIRS.join(', ')}`);
    console.log(`Checking extensions: ${JS_EXTENSIONS.join(', ')}\n`);

    const startTime = Date.now();
    await scanDirectory(absoluteTargetDir);
    const endTime = Date.now();

    process.stdout.write('\r' + ' '.repeat(90) + '\r');

    console.log("\n--- Scan Complete ---");
    console.log(`Total files checked: ${filesChecked}`);
    console.log(`Syntax errors found: ${errorCount}`);
    console.log(`Time taken: ${(endTime - startTime) / 1000} seconds`);

    if (errorCount > 0) {
        console.log("\n‼️  Syntax errors detected. Please fix them.");
        process.exit(1);
    } else {
        console.log("\n✅ No syntax errors found!");
        process.exit(0);
    }
}

main().catch(err => {
    console.error("\n🚨 An unexpected error occurred during the script execution:");
    console.error(err);
    process.exit(1);
});