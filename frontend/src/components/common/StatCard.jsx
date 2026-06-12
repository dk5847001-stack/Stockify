const StatCard = ({ title, value, delta, icon: Icon, tone = "primary" }) => {
  return (
    <article className={`stat-card tone-${tone}`}>
      <div className="stat-icon">{Icon ? <Icon size={22} /> : null}</div>
      <div>
        <p>{title}</p>
        <h2>{value}</h2>
        <span>{delta}</span>
      </div>
    </article>
  );
};

export default StatCard;
