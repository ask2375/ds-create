export default function printWpUrl({ wpPort, wpHost = "localhost" }) {
  return {
    name: "print-wp-url",
    apply: "serve",
    configureServer(server) {
      server.printUrls = () => {
        server.config.logger.info("  ➜  WordPress: http://" + wpHost + ":" + wpPort + "/");
      };
    },
  };
}
