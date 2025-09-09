/**
 * TypeScript port of https://github.com/chbrown/socks-server.
 *
 * Exports `runSocksServer` function to start the server from your code (doesn't start the server automatically).
 */
import net from "net";

function formatIPv4(buffer: Buffer) {
  // buffer.length == 4
  return buffer[0] + "." + buffer[1] + "." + buffer[2] + "." + buffer[3];
}

function formatIPv6(buffer: Buffer) {
  // buffer.length == 16
  const parts: string[] = [];
  for (let i = 0; i < 16; i += 2) {
    parts.push(buffer.readUInt16BE(i).toString(16));
  }
  return parts.join(":");
}

/**
Returns an object with three properties designed to look like the address
returned from socket.address(), e.g.:

    { family: 'IPv4', address: '127.0.0.1', port: 12346 }
    { family: 'IPv6', address: '1404:abf0:c984:ed7d:110e:ea59:69b6:4490', port: 8090 }
    { family: 'domain', address: '1404:abf0:c984:ed7d:110e:ea59:69b6:4490', port: 8090 }

The given `type` should be either 1, 3, or 4, and the `buffer` should be
formatted according to the SOCKS5 specification.
*/
function readAddress(type, buffer) {
  if (type == 1) {
    // IPv4 address
    return {
      family: "IPv4",
      address: formatIPv4(buffer),
      port: buffer.readUInt16BE(4),
    };
  } else if (type == 3) {
    // Domain name
    const length = buffer[0];
    return {
      family: "domain",
      address: buffer.slice(1, length + 1).toString(),
      port: buffer.readUInt16BE(length + 1),
    };
  } else if (type == 4) {
    // IPv6 address
    return {
      family: "IPv6",
      address: formatIPv6(buffer),
      port: buffer.readUInt16BE(16),
    };
  } else {
    throw new Error("Unsupported address type: " + type);
  }
}

interface RunSocksServerOptions {
  port?: number;
  host?: string;
}

export function runSocksServer(
  options: RunSocksServerOptions,
): Promise<net.Server> {
  const { port = 1080, host = "0.0.0.0" } = options;

  const server = net
    .createServer(function (socket) {
      socket
        .once("data", function (greeting) {
          const socks_version = greeting[0];
          if (socks_version === 4) {
            const address = {
              port: greeting.subarray(2, 4).readUInt16BE(0),
              address: formatIPv4(greeting.subarray(4)),
            };
            // var user = greeting.slice(8, -1).toString();
            net.connect(address.port, address.address, function () {
              // the socks response must be made after the remote connection has been
              // established
              socket.pipe(this).pipe(socket);
              socket.write(Buffer.from([0, 0x5a, 0, 0, 0, 0, 0, 0]));
            });
          } else if (socks_version === 5) {
            // greeting = [socks_version, supported_authentication_methods,
            //             ...supported_authentication_method_ids]
            socket.write(Buffer.from([5, 0]));
            socket.once("data", function (connection) {
              const address_type = connection[3];
              const address = readAddress(address_type, connection.subarray(4));

              net.connect(address.port, address.address, function () {
                socket.pipe(this).pipe(socket);
                const response = Buffer.from(connection);
                response[1] = 0;
                socket.write(response);
              });
            });
          }
        })
        .on("error", function (err) {
          console.error("socket error: %s", err.message);
        })
        .on("end", function () {
          socket.end(); // is this unnecessary?
        });
    })
    .on("listening", function () {
      const address = this.address();
      console.log(
        "server listening on tcp://%s:%d",
        address.address,
        address.port,
      );
    })
    .on("error", function (err) {
      console.error("server error: %j", err);
    });

  return new Promise((resolve) => {
    server.listen({ port, host }, () => resolve(server));
  });
}
