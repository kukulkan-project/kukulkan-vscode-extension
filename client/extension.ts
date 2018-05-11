'use strict';

import * as path from 'path';
import * as cp from 'child_process';
import * as os from 'os';
import {
    workspace,
    commands,
    Disposable,
    Uri,
    ExtensionContext
} from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    SettingMonitor,
    ServerOptions,
    TransportKind,
    Position as LSPosition, Location as LSLocation
} from 'vscode-languageclient';

export function activate(context: ExtensionContext) {

    // The server is implemented in java with Xtext
    let executable = 'ls.jar';
    let serverModule = context.asAbsolutePath(path.join('client', executable));
    console.log(serverModule);

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    let serverOptions: ServerOptions = {
        run: {
            command: 'java',
            args: ['-jar', serverModule]
        },
        debug: {
            command: 'java',
            args: ['-jar', serverModule, '-Xdebug', '-Xrunjdwp:server=y,transport=dt_socket,address=8000,suspend=n,quiet=y', '-Xmx256m']
        }
    }

    // Options to control the language client
    let clientOptions: LanguageClientOptions = {
        // Register the server for plain text documents
        documentSelector: ['3k', 'kukulkan'],
        synchronize: {
            // Synchronize the setting section 'kukulkanLanguageServer' to the server
            configurationSection: 'kukulkanLanguageServer',
            // Notify the server about file changes to '.3k files contain in the workspace
            fileEvents: [
                workspace.createFileSystemWatcher('**/*.3k'),
                workspace.createFileSystemWatcher('**/*.kukulkan')
            ]
        }
    }

    // Create the language client and start the client.
    let languageClient = new LanguageClient('kukulkanLanguageServer', 'Kukulkan Language Server', serverOptions, clientOptions);
    let disposable = languageClient.start()

    commands.registerCommand('kukulkan.show.references', (uri: string, position: LSPosition, locations: LSLocation[]) => {
        commands.executeCommand('editor.action.showReferences',
            Uri.parse(uri),
            languageClient.protocol2CodeConverter.asPosition(position),
            locations.map(languageClient.protocol2CodeConverter.asLocation));
    })

    commands.registerCommand('kukulkan.apply.workspaceEdit', (obj) => {
        let edit = languageClient.protocol2CodeConverter.asWorkspaceEdit(obj);
        if (edit) {
            workspace.applyEdit(edit);
        }
    });

    // Push the disposable to the context's subscriptions so that the 
    // client can be deactivated on extension deactivation
    context.subscriptions.push(disposable);
}