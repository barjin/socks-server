# socks-server-lib

[SOCKS](https://en.wikipedia.org/wiki/SOCKS) (Socket Secure) proxy server.

- Supports SOCKS4
- Supports SOCKS5
- Authentication is not yet implemented

## Usage

socks-server-lib can be used either as a library or as a command line tool.

### As a library

You can run the SOCKS v4/v5 server from your own code like this:

```typescript
import { runSocksServer } from "socks-server-lib";
const server = await runSocksServer({ port: 1080 });

console.log(`SOCKS server running on port ${server.address().port}`);

server.close(() => {
  console.log("SOCKS server closed");
});
```

This is useful e.g. if you want to test your application with a SOCKS proxy.

### As a command line tool

You can also run the server from the command line.

```bash
npx socks-server-lib
```

This will start the server on port 1080. You can specify a different port / host with the `PORT` and `HOST` environment variables.

## License

Copyright 2015 Christopher Brown. [MIT Licensed](http://chbrown.github.io/licenses/MIT/#2015).

TypeScript / library port by Jindřich Bär, 2025.
```
