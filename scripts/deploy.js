const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==================================================");
  console.log("Deploying OrganDonation Smart Contract...");
  console.log("==================================================");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with account (Hospital Admin):", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  const OrganDonation = await ethers.getContractFactory("OrganDonation");
  const organDonation = await OrganDonation.deploy();
  await organDonation.waitForDeployment();

  const contractAddress = await organDonation.getAddress();
  console.log("SUCCESS! OrganDonation deployed to:", contractAddress);
  console.log("Admin address configured to:", deployer.address);

  // Read the artifact to extract ABI
  const artifactPath = path.join(__dirname, "../artifacts/contracts/OrganDonation.sol/OrganDonation.json");
  let artifact = {};
  if (fs.existsSync(artifactPath)) {
    artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  }

  // Target directory for frontend configuration
  const frontendDir = path.join(__dirname, "../frontend/src/contracts");
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }

  const network = await ethers.provider.getNetwork();

  const configData = {
    address: contractAddress,
    adminAddress: deployer.address,
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    abi: artifact.abi || [],
  };

  const configFilePath = path.join(frontendDir, "contractConfig.json");
  fs.writeFileSync(configFilePath, JSON.stringify(configData, null, 2));

  console.log("Exported contract configuration and ABI to:");
  console.log(" ->", configFilePath);
  console.log("==================================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
