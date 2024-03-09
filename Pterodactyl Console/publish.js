const { exec } = require('child_process');
const rcedit = require('rcedit');
const os = require('os');

async function modifyExecutable() {
    try {
        await exec('@echo off & title Build & cls & del index-linux /s /q /f > nul & del index-macos /s /q /f > nul & del index-win.exe /s /q /f > nul & del Pterodactyl.exe /s /q /f > nul & del PterodactylMac /s /q /f > nul & del PterodactylLinux /s /q /f > nul & rmdir /s /q dist & ncc build index.js', (error, stdout, stderr) => {
            if (error) {
                console.error('Error running prebuild.bat commands:', error);
                return;
            }
            console.log('Prebuild commands executed successfully');

            exec('@echo off & title Build & cls & pkg dist/index.js', async (error, stdout, stderr) => {
                if (error) {
                    console.error('Error running makebuild.bat commands:', error);
                    return;
                }
                console.log('Makebuild commands executed successfully');

                exec('@echo off & title Build & cls & rename index-win.exe Pterodactyl.exe & rename index-macos PterodactylMac & rename index-linux PterodactylLinux', async (error, stdout, stderr) => {
                    if (error) {
                        console.error('Error running finish.bat commands:', error);
                        return;
                    }
                    console.log('Finish commands executed successfully');

                    //await rcedit("./Pterodactyl.exe", {
                    //    'product-version': '1,0.0.0',
                    //    'file-version': '1,0.0.0',
                    //    icon: "./pterry.ico",
                    //    'version-string': {
                    //        FileDescription: 'A small pterodactyl warper to connect to a pterodactyl server using a websocket!',
                    //        ProductName: 'Pterodactyl Console',
                    //        LegalCopyright: `Copyright © 2023 - ${new Date().getFullYear()} MythicalSystems.`,
                    //        OriginalFilename: 'Pterodactyl.exe',
                    //    },
                    //});
                    console.log("Executable modification complete.");
                });
            });
        });
    } catch (error) {
        console.error("Error:", error);
    }
}
if (os.platform() === 'win32') {
    modifyExecutable();
} else {
    console.log("We are sorry but you can only publish on windwos!");
}