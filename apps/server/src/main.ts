import { createServer } from 'node:http';
import { Readable } from 'node:stream';

import { File } from '@effect/platform/Http/FormData';
import { ServerRequest } from '@effect/platform/Http/ServerRequest';
import { fileToReadable } from '@effect/platform-node/Http/FormData';
import * as Http from '@effect/platform-node/HttpServer';
import { runMain } from '@effect/platform-node/Runtime';
import { Chunk, Effect, Layer, Sink, Stream } from 'effect';

const ServerLive = Http.server.layer(() => createServer(), { port: 3000 });

async function* getDataReadable(data: Readable) {
    for await (const chunk of data) {
        yield chunk;
    }
}

const serve = Http.router.empty.pipe(
    Http.router.post(
        '/api/upload',
        Effect.gen(function* (_) {
            const serverRequest = yield* _(ServerRequest);
            const [fileChunk] = yield* _(
                serverRequest.formDataStream,
                Stream.filter((a): a is File => a._tag === 'File'),
                Stream.peel(Sink.take(1)),
            );
            const file = yield* _(Chunk.head(fileChunk));
            const readable = fileToReadable(file);
            yield* _(
                Effect.tryPromise({
                    try: async () => {
                        for await (const chunk of getDataReadable(readable)) {
                            console.log('chunk length', chunk.length);
                        }
                        console.log('end');
                    },
                    catch: () => new Error('it failed'),
                }),
            );
            // yield* _(
            //     Effect.tryPromise({
            //         try: () => {
            //             return new Promise((resolve, reject) => {
            //                 readable.on('data', chunk => {
            //                     console.log('chunk', chunk.length);
            //                 });
            //                 readable.on('end', () => {
            //                     console.log('end');
            //                     resolve(undefined);
            //                 });
            //                 readable.on('error', error => {
            //                     console.log('error', error);
            //                     reject(error);
            //                 });
            //             });
            //         },
            //         catch: () => new Error('it failed'),
            //     }),
            // );
            // return yield* _(Http.response.json({ hello: 'world' }));
            return Http.response.empty();
        }).pipe(Effect.scoped),
    ),
    Http.server.serve(Http.middleware.logger),
);

const HttpLive = Layer.scopedDiscard(serve).pipe(Layer.use(ServerLive));

Layer.launch(HttpLive).pipe(Effect.tapErrorCause(Effect.logError), runMain);
