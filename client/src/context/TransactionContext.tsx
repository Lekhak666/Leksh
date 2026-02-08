import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { contractABI, contractAddress } from "../utils/constants";

export const TransactionContext = React.createContext<any>(null);

const getEthereum = () => {
if (typeof window === "undefined") return null;
return (window as any).ethereum;
};

const getEthereumContract = async () => {
const ethereum = getEthereum();
if (!ethereum) throw new Error("Please install MetaMask.");

const provider = new ethers.BrowserProvider(ethereum);
const signer = await provider.getSigner();

const transactionContract = new ethers.Contract(
contractAddress,
contractABI,
signer
);

return transactionContract;
};

export const TransactionProvider = ({ children }: any) => {
const [currentAccount, setCurrentAccount] = useState("");
const [formData, setFormData] = useState({
addressTo: "",
amount: "",
keyword: "",
message: "",
});
const [isLoading, setIsLoading] = useState(false);
const [transactionCount, setTransactionCount] = useState(localStorage.getItem("transactionCount") || "0");
const [transactions, setTransactions] = useState([]);
const [state, setstate] = useState([]);

const handleChange = (e: any, name: string) => {
setFormData((prevState) => ({ ...prevState, [name]: e.target.value }));
};

const getAllTransactions = async () => {
try {
if(!getEthereum()) return alert("Please install MetaMask.");

const transactionContract = await getEthereumContract();
const availableTransactions = await transactionContract.getAllTransactions();

const structuredTransactions = availableTransactions.map((transaction: any) => ({
  addressTo: transaction.receiver,
  addressFrom: transaction.sender,

  timestamp: new Date(Number(transaction.timestamp) * 1000).toLocaleString(),

  message: transaction.message,
  keyword: transaction.keyword,
  
  amount: ethers.formatEther(transaction.amount),
}));


console.log("Available Transactions:", availableTransactions);
setTransactions(structuredTransactions);
} catch (error) {
console.error("getAllTransactions error:", error);
}
};

const checkIfWalletIsConnected = async () => {
try {
const ethereum = getEthereum();
if (!ethereum) return;

const accounts = await ethereum.request({ method: "eth_accounts" });

if (accounts.length > 0) {
setCurrentAccount(accounts[0]);

getAllTransactions();
} else {
console.log("No accounts found");
}
} catch (error) {
console.error("checkIfWalletIsConnected error:", error);
}
};

const checkIfTransactionsExist = async () => {
try {
const transactionContract = await getEthereumContract();
const transactionCount = await transactionContract.getTransactionCount();

window.localStorage.setItem("transactionCount", transactionCount);
} catch (error) {
console.error("checkIfTransactionsExist error:", error);
}
};

const connectWallet = async () => {
try {
const ethereum = getEthereum();
if (!ethereum) return alert("Please install MetaMask.");

const accounts = await ethereum.request({
method: "eth_requestAccounts",
});

setCurrentAccount(accounts[0]);
} catch (error) {
console.error("connectWallet error:", error);
}
};

const sendTransaction = async () => {
await switchToSepolia();

try {
setIsLoading(true); // ✅ START LOADING

const ethereum = getEthereum();
if (!ethereum) {
setIsLoading(false);
return alert("Please install MetaMask.");
}

const { amount, keyword, message } = formData;

const addressTo = formData.addressTo.trim();

if (!ethers.isAddress(addressTo)) {
setIsLoading(false);
return alert("Invalid receiver address.");
}

if (!amount || Number(amount) <= 0) {
setIsLoading(false);
return alert("Please enter a valid ETH amount.");
}

const transactionContract = await getEthereumContract();
const parsedAmount = ethers.parseEther(amount);
const hexValue = ethers.toBeHex(parsedAmount);

// ✅ 1) send native eth
await ethereum.request({
method: "eth_sendTransaction",
params: [
{
from: currentAccount,
to: addressTo,
gas: "0x5208",
value: hexValue,
},
],
});

// ✅ 2) store tx in contract
const tx = await transactionContract.addToBlockchain(
addressTo,
parsedAmount,
message,
keyword
);

await tx.wait();

// optional: clear inputs
setFormData({
addressTo: "",
amount: "",
keyword: "",
message: "",
});

} catch (error) {
console.error("sendTransaction error:", error);
} finally {
setIsLoading(false); // ✅ STOP LOADING NO MATTER WHAT
}
};


useEffect(() => {
checkIfWalletIsConnected();
checkIfTransactionsExist();
getAllTransactions();
}, []);

return (
<TransactionContext.Provider
value={{
connectWallet,
currentAccount,
formData,
setFormData,
handleChange,
sendTransaction,
transactions,
isLoading,
}}
>
{children}
</TransactionContext.Provider>
);
};

const switchToSepolia = async () => {
const ethereum = getEthereum();
if (!ethereum) return;

const sepoliaChainId = "0xaa36a7";

try {
await ethereum.request({
method: "wallet_switchEthereumChain",
params: [{ chainId: sepoliaChainId }],
});
} catch (switchError: any) {
// If Sepolia not added
if (switchError.code === 4902) {
await ethereum.request({
method: "wallet_addEthereumChain",
params: [
{
chainId: sepoliaChainId,
chainName: "Sepolia Test Network",
rpcUrls: ["https://rpc.sepolia.org"],
nativeCurrency: {
name: "SepoliaETH",
symbol: "SEP",
decimals: 18,
},
blockExplorerUrls: ["https://sepolia.etherscan.io"],
},
],
});
}
}
};