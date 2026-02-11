import './AmbientGlow.css';

function AmbientGlow() {
  // Génère 3-5 formes (entre 3 et 5 aléatoirement)
  const glowCount = Math.floor(Math.random() * 3) + 3; // 3-5 formes
  
  // Positions asymétriques prédéfinies pour une répartition sur toute la hauteur (200vh)
  // Formes très étirées horizontalement (ellipses larges et peu hautes)
  const positions = [
    { top: '0%', left: '-10%', width: '120%', height: '45%' }, // Coin haut-gauche (première section) - très étiré
    { top: '70%', right: '-5%', width: '115%', height: '14%' }, // Bas-droit (deuxième section) - très étiré
    { top: '95%', left: '-8%', width: '125%', height: '16%' }, // Très bas (fin deuxième section) - très étiré
  ];

  // Variations de couleur : versions plus claires de #052315 ou blanc avec faible opacité
  const colors = [
    'rgba(255, 255, 255, 0.04)', // Blanc très transparent
    'rgba(255, 255, 255, 0.02)', // Blanc encore plus transparent
    'rgba(255, 255, 255, 0.03)', // Blanc transparent
  ];

  // Rotations pour chaque forme (en degrés)
  const rotations = [
    -40, // Rotation pour la première forme
    -15, // Rotation pour la deuxième forme
    20,  // Rotation pour la troisième forme
  ];

  return (
    <div className="ambient-glow-container">
      {Array.from({ length: glowCount }).map((_, index) => {
        const position = positions[index];
        const color = colors[index % colors.length];
        const rotation = rotations[index % rotations.length];
        
        return (
          <div
            key={index}
            className="ambient-glow-shape"
            style={{
              ...position,
              backgroundColor: color,
              transform: `rotate(${rotation}deg)`,
            }}
          />
        );
      })}
    </div>
  );
}

export default AmbientGlow;

