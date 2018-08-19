exports.configure = (services) => {
  console.log('configure theme');

  const config = services.get('config').getConfig('theme');
  const renderer = services.get('renderer');

  let manager = new ThemeManager(config, renderer);

  services.register('theme.manager', manager);
  services.get('express').use(manager.middleware);

  services.get('events').on('kernel.boot', () => {
    const themes = services.get('theme.manager').themes;
    const static_middleware = services.get('middleware.static');
    const static_files = services.get('static_files');

    for (let [theme_id, path] of themes) {
      let web_path = `/themes/${theme_id}`;
      let disk_path = `${path}/dist`;
      static_files.use(web_path, static_middleware(disk_path));
    }
  });
};

class ThemeManager {
  constructor(config, renderer) {
    this.__themes = new Map;
    this.__config = config;
    this.__renderer = renderer;
  }

  get config() {
    return this.__config;
  }

  get renderer() {
    return this.__renderer;
  }

  get middleware() {
    return async (req, res, next) => {
      try {
        let theme = this.__config.get('main');
        let layout_path = this.themes.get(theme) + '/templates/layout';

        if (res.locals.result) {
          res.locals.result = await this.renderer.render(layout_path, { content: res.locals.result });
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  get themes() {
    return this.__themes;
  }

  register(theme_id, path) {
    this.__themes.set(theme_id, path);
  }
}
