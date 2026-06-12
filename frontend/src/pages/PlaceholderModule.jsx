const PlaceholderModule = ({ title }) => {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow mb-1">Coming Module</p>
          <h2>{title}</h2>
        </div>
        <span className="status-chip">Planned</span>
      </div>
      <p className="text-secondary mb-0">
        This workspace is ready for the next Stockify phase.
      </p>
    </section>
  );
};

export default PlaceholderModule;
