const SAMPLE_PRODUCTS = [
  { name: "Organic Fairtrade Coffee Beans Batch #101", description: "Grade A Arabica beans harvested from high-altitude farm.", location: "Medellín, Colombia" },
  { name: "Precision Industrial Sensor Array Alpha", description: "IoT temperature & humidity sensors for cold chain monitoring.", location: "Stuttgart, Germany" },
  { name: "Extra Virgin Artisanal Olive Oil Lot #42", description: "Cold pressed organic extra virgin olive oil in dark glass bottles.", location: "Tuscany, Italy" },
  { name: "Pharmaceutical Grade Vaccines Batch B9", description: "Temperature-sensitive vaccines stored at -20°C.", location: "Basel, Switzerland" },
  { name: "Luxury Swiss Watch Chronograph Movement", description: "Handcrafted automatic movement serial #88201.", location: "Geneva, Switzerland" },
  { name: "Solar Panel Photovoltaic Cell Array X7", description: "Monocrystalline high-efficiency solar panel module.", location: "Kyoto, Japan" },
  { name: "Bio-degradable Packaging Film Roll", description: "Compostable plant-based eco packaging film.", location: "Portland, USA" },
  { name: "Cold-Pressed Raw Almond Oil Batch #15", description: "100% pure organic almond oil for cosmetics.", location: "Valencia, Spain" },
  { name: "Electric Vehicle Battery Pack v3", description: "Lithium-ion high density energy battery module.", location: "Fremont, USA" },
  { name: "Aerospace Grade Titanium Components", description: "Precision machined titanium alloy structural parts.", location: "Toulouse, France" },
  { name: "Specialty Ethiopian Yirgacheffe Coffee", description: "Single-origin washed Ethiopian coffee beans.", location: "Addis Ababa, Ethiopia" },
  { name: "Smart Microcontroller Chip Module", description: "32-bit RISC-V embedded microchips lot #993.", location: "Hsinchu, Taiwan" },
  { name: "Organic Wildflower Honey Barrel #8", description: "Raw unfiltered organic honey in food-grade barrel.", location: "Waikato, New Zealand" },
  { name: "High-Purity Copper Wire Coil 500m", description: "99.99% oxygen-free copper electrical wiring.", location: "Santiago, Chile" },
  { name: "Gourmet Single-Origin Cocoa Mass Batch #3", description: "70% dark cocoa liquor mass for bean-to-bar chocolate.", location: "Accra, Ghana" }
];

async function seedProducts(ethersInstance) {
  if (!window.ethereum) {
    throw new Error("Ethereum provider not available.");
  }
  const ethers = ethersInstance || window.ethers;
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  
  const abi = [
    "function registerUser(uint8 _role) external",
    "function createProduct(string _name, string _description, string _initialLocation) external returns (uint256)",
    "function userRoles(address) external view returns (uint8)",
    "function productCount() external view returns (uint256)"
  ];
  
  const contractAddress = "0x417Bf7C9dc415FEEb693B6FE313d1186C692600F";
  const contract = new ethers.Contract(contractAddress, abi, signer);

  const currentRole = await contract.userRoles(address);
  if (Number(currentRole) !== 1) {
    console.log("Registering user as Manufacturer (Role 1)...");
    const regTx = await contract.registerUser(1);
    await regTx.wait();
  }

  console.log("Seeding 15 products...");
  for (let i = 0; i < SAMPLE_PRODUCTS.length; i++) {
    const item = SAMPLE_PRODUCTS[i];
    console.log(`[${i+1}/15] Creating ${item.name}...`);
    const tx = await contract.createProduct(item.name, item.description, item.location);
    await tx.wait();
  }
  
  const count = await contract.productCount();
  console.log(`Seeding complete! Total products: ${count.toString()}`);
  return Number(count);
}

if (typeof window !== 'undefined') {
  window.seedSupplyChainProducts = seedProducts;
  window.SAMPLE_PRODUCTS = SAMPLE_PRODUCTS;
}
