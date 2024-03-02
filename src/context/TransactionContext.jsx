import React, { useEffect, useState } from 'react'
import { ethers } from "ethers"
import { contractABI, contractAddress } from "../utils/constants"

const TransactionContext = React.createContext()
// export default TransactionContext
const { ethereum } = window;

const getEthereumContract = () => {
    if (!ethereum) {
        console.error("Ethereum provider not available.");
        return;
    }

    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const transactionContract = new ethers.Contract(contractAddress, contractABI, signer);

    return transactionContract;
}

const TransactionProvider = ({ children }) => {
    const [formData, setformData] = useState({ addressTo: "", amount: "", keyword: "", message: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [currentAccount, setCurrentAccount] = useState("")
    const [transactionCount, setTransactionCount] = useState(localStorage.getItem("transactionCount"));
  const [transactions, setTransactions] = useState([]);


    const handleChange = (e, name) => {
        setformData((prevState) => ({ ...prevState, [name]: e.target.value }));
    };

    const getAllTransactions = async () => {
    try {
      if (ethereum) {
        const transactionsContract =  getEthereumContract();

        const availableTransactions = await transactionsContract.getAllTransactions();
        console.log("fdhs");
        console.log(availableTransactions);
        const structuredTransactions = availableTransactions.map((transaction) => ({
          addressTo: transaction.receiver,
          addressFrom: transaction.from,
          timestamp: new Date(transaction.timestamp.toNumber() * 1000).toLocaleString(),
          message: transaction.message,
          keyword: transaction.keyword,
          amount: parseInt(transaction.amount._hex) / (10 ** 18)
        }));

        console.log(structuredTransactions);

        setTransactions(structuredTransactions);
      } else {
        console.log("Ethereum is not present");
      }
    } catch (error) {
      console.log(error);
    }
  };
    const checkIfWalletIsConnected = async () => {
        try {
            if (!ethereum) return alert("Please install metamask");
            const accounts = await ethereum.request({ method: 'eth_accounts' });
            if (accounts.length) {
                setCurrentAccount(accounts[0])
        getAllTransactions();

            }
            console.log(accounts);
        } catch (error) {
            console.log(error);
        }

    }
    
  const checkIfTransactionsExists = async () => {
    try {
      if (ethereum) {
        const transactionsContract = getEthereumContract();
        const currentTransactionCount = await transactionsContract.getTransactionCount();

        window.localStorage.setItem("transactionCount", currentTransactionCount);

      }
    } catch (error) {
      console.log(error);

      throw new Error("No ethereum object");
    }
  };

    const connectWallet = async () => {
        try {
            if (!ethereum) return alert("Please install metamask");

            const accounts = await ethereum.request({ method: "eth_requestAccounts" });

            setCurrentAccount(accounts[0]);
        } catch (error) {
            console.log(error);
        }
    }

    const sendTransactions = async () => {
        try {
            if (!ethereum) return alert("Please install metamask")
            // get form data
            const { addressTo, amount, keyword, message } = formData;
            const transactionContract = getEthereumContract()
            const parsedAmount = ethers.utils.parseEther(parseFloat(amount).toString())
            console.log(amount);
            console.log(parsedAmount);
            console.log(parsedAmount._hex);
            console.log("pehle");
            await ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: currentAccount,
                    to: addressTo,
                    gas: '0x5208',
                    value: parsedAmount._hex
                }]
            });
            const transactionHash = await transactionContract.addToBlockchain(addressTo, parsedAmount, message, keyword)
            console.log("bich");
            setIsLoading(true);
            console.log(`Loading - ${transactionHash.hash}`);
            await transactionHash.wait();
            console.log(`Success - ${transactionHash.hash}`);
            setIsLoading(false);

            const transactionsCount = await transactionContract.getTransactionCount();

            setTransactionCount(transactionsCount.toNumber());
            window.location.reload();

        } catch (error) {
            console.log(error);

        }
    }

    useEffect(() => {
        checkIfWalletIsConnected();
    checkIfTransactionsExists();
    }, []);
    return (
        <TransactionContext.Provider value={{ connectWallet, currentAccount, formData, sendTransactions, handleChange , transactions , isLoading }}>
            {children}
        </TransactionContext.Provider>
    )
}

export { TransactionContext, TransactionProvider };










//0xa2258ba36bb0a4b23f1ad2f55bdbf0900a9fee48dd1e177b2132aad30c5130ec