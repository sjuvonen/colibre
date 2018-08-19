exports.configure = (services) => {
  services.get('theme.manager').register('pinecone', __dirname);
};
