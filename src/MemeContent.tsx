import { useEffect, useState } from 'react';
import { message, createDataItemSigner, result } from "@permaweb/aoconnect";
import { PermissionType } from 'arconnect';
import "./MemeContent.css";

const permissions: PermissionType[] = [
  'ACCESS_ADDRESS',
  'SIGNATURE',
  'SIGN_TRANSACTION',
  'DISPATCH'
];

interface Tag {
  name: string;
  value: string;
}

interface StakerDetails {
  [key: string]: number;
}

interface ProposalDetail {
  stake: number;
  pattern: string;
  handle: string;
  stakers: StakerDetails;
  scheduler: string; 
}

interface Proposal {
  name: string;
  stake: number;
  pattern: string;
  handle: string;
  stakers: StakerDetails;
  scheduler: string;
}

const GARD = "jpp5Yy2LVExtw8n8PvC7Sz2i5GQehVjfiQlWi0TYBqE";
const PROPOSAL_PROCESS = "1zCvtQLBov7WDCRyLYaiZOHp5PlqgfG4zvlzw6CaZpE";
const CRED = "Sa0iBLPNyJQrwpTTG-tWLQU-1QeUAJA73DdxGGiKoJc";
const UNIT_CONVERSION = 1000;

function MemeContent() {
  const [address, setAddress] = useState('');
  const [gardBalance, setGardBalance] = useState(0);
  const [credBalance, setCredBalance] = useState(0);
  const [credValue, setCredValue] = useState('');
  const [stakeValue, setStakeValue] = useState('');
  const [stakeName, setStakeName] = useState('');
  const [propName, setPropName] = useState('');
  const [propPattern, setPropPattern] = useState('');
  const [propHandle, setPropHandle] = useState('');
  const [propScheduler, setPropScheduler] = useState(''); 
  const [swapSuccess, setSwapSuccess] = useState(false);
  const [stakeSuccess, setStakeSuccess] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);

  const fetchAddress = async () => {
    try {
      await window.arweaveWallet.connect(
        permissions,
        {
          name: "GARD",
          logo: "r0THy0vN0VqEhdg8sZNBVPfu30wBwgUefdGOTsQ0SaY"
        }
      );
      const address = await window.arweaveWallet.getActiveAddress();
      setAddress(address);
    } catch (error) {
      console.error('Error connecting to Arweave Wallet:', error);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    switch (name) {
      case "stakeName":
        setStakeName(value);
        break;
      case "stakeValue":
        setStakeValue(value);
        break;
      case "swap":
        setCredValue(value);
        break;
      case "propName":
        setPropName(value);
        break;
      case "propScheduler":
        setPropScheduler(value);
        break;
      default:
        break;
    }
  };

  const handleTextAreaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    switch (name) {
      case "propPattern":
        setPropPattern(value);
        break;
      case "propHandle":
        setPropHandle(value);
        break;
      default:
        break;
    }
  };

  const swap = async () => {
    var value = parseInt(credValue);
    var units = value * UNIT_CONVERSION;
    var credUnits = units.toString();
    try {
      const getSwapMessage = await message({
        process: CRED,
        tags: [
          { name: 'Action', value: 'Transfer' },
          { name: 'Recipient', value: GARD },
          { name: 'Quantity', value: credUnits }
        ],
        signer: createDataItemSigner(window.arweaveWallet),
      });
      try {
        let { Messages, Error } = await result({
          message: getSwapMessage,
          process: CRED,
        });
        if (Error) {
          console.error("Error handling swap:", Error);
          alert("Error handling swap:" + Error);
          return;
        }
        if (!Messages || Messages.length === 0) {
          console.error("No messages were returned from ao. Please try later.");
          alert("No messages were returned from ao. Please try later.");
          return;
        }
        const actionTag = Messages[0].Tags.find((tag: Tag) => tag.name === 'Action');
        if (actionTag && actionTag.value === "Debit-Notice") {
          setSwapSuccess(true);
          alert("Swap successful!");
        }
      } catch (error) {
        console.error("There was an error when swapping CRED for GARD: ", error);
        alert("There was an error when swapping CRED for GARD: " + error);
      }
    } catch (error) {
      console.error('There was an error swapping: ', error);
      alert('There was an error swapping: ' + error);
    }
  };

  const stake = async () => {
    var value = parseInt(stakeValue);
    var units = value * UNIT_CONVERSION;
    var gardUnits = units.toString();
    try {
      const getStakeMessage = await message({
        process: GARD,
        tags: [
          { name: 'Action', value: 'Stake' },
          { name: 'Quantity', value: gardUnits },
          { name: 'Name', value: stakeName },
        ],
        signer: createDataItemSigner(window.arweaveWallet),
      });
      try {
        let { Messages, Error } = await result({
          message: getStakeMessage,
          process: GARD,
        });
        if (Error) {
          console.error("Error handling staking:", Error);
          alert("Error handling staking:" + Error);
          return;
        }
        if (!Messages || Messages.length === 0) {
          console.error("No messages were returned from ao. Please try later.");
          alert("No messages were returned from ao. Please try later.");
          return;
        }
        alert(Messages[0].Data);
        setStakeSuccess(true);
        alert("Stake successful!");
      } catch (error) {
        console.error("There was an error when staking GARD: ", error);
        alert("There was an error when staking GARD: " + error);
      }
    } catch (error) {
      console.error('There was an error staking: ', error);
      alert('There was an error staking: ' + error);
    }
  };

  const propose = async () => {
    try {
      const getPropMessage = await message({
        process: PROPOSAL_PROCESS,
        tags: [
          { name: 'Action', value: 'Propose' },
          { name: 'Name', value: propName },
          { name: 'Pattern', value: propPattern },
          { name: 'Handle', value: propHandle },
          { name: 'Scheduler', value: propScheduler } 
        ],
        signer: createDataItemSigner(window.arweaveWallet),
      });
      try {
        let { Messages, Error } = await result({
          message: getPropMessage,
          process: PROPOSAL_PROCESS,
        });
        if (Error) {
          console.error("Error handling proposal:", Error);
          alert("Error handling proposal:" + Error);
          return;
        }
        if (!Messages || Messages.length === 0) {
          console.error("No messages were returned from ao. Please try later.");
          alert("No messages were returned from ao. Please try later.");
          return;
        }
        alert(Messages[0].Data);
        resetProposalInputs();
        alert("Proposal successful!");
      } catch (error) {
        console.error("There was an error when proposing: ", error);
        alert("There was an error when proposing: " + error);
      }
    } catch (error) {
      console.error('There was an error staking: ', error);
      alert('There was an error staking: ' + error);
    }
  };

  const resetProposalInputs = () => {
    setPropName('');
    setPropPattern('');
    setPropHandle('');
    setPropScheduler(''); 
  };

  useEffect(() => {
    const fetchBalance = async (process: string) => {
      try {
        const messageResponse = await message({
          process,
          tags: [
            { name: 'Action', value: 'Balance' },
          ],
          signer: createDataItemSigner(window.arweaveWallet),
        });

        const { Messages, Error } = await result({
          message: messageResponse,
          process,
        });

        if (Error) {
          console.error("Error fetching balances:", Error);
          alert("Error fetching balances:" + Error);
          return;
        }
        if (!Messages || Messages.length === 0) {
          console.error("No messages were returned from ao. Please try later.");
          alert("No messages were returned from ao. Please try later.");
          return;
        }
        const balanceTag = Messages[0].Tags.find((tag: Tag) => tag.name === 'Balance');
        const balance = balanceTag ? parseFloat((balanceTag.value / UNIT_CONVERSION).toFixed(4)) : 0;
        if (process === GARD) {
          setGardBalance(balance);
        }
        if (process === CRED) {
          setCredBalance(balance);
        }
      } catch (error) {
        console.error("There was an error fetching balances: ", error);
      }
    };

    if (address) {
      fetchBalance(GARD);
      fetchBalance(CRED);
    }
  }, [address, swapSuccess, stakeSuccess]);

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const messageResponse = await message({
          process: PROPOSAL_PROCESS,
          tags: [
            { name: 'Action', value: 'Proposals' },
          ],
          signer: createDataItemSigner(window.arweaveWallet),
        });

        const { Messages, Error } = await result({
          message: messageResponse,
          process: PROPOSAL_PROCESS,
        });

        if (Error) {
          console.error("Error fetching proposals:", Error);
          alert("Error fetching proposals:" + Error);
          return;
        }
        if (!Messages || Messages.length === 0) {
          console.error("No messages were returned from ao. Please try later.");
          alert("No messages were returned from ao. Please try later.");
          return;
        }
        const data = JSON.parse(Messages[0].Data);
        const proposalsData = Object.entries(data).map(([name, details]) => {
          const typedDetails: ProposalDetail = details as ProposalDetail;
          return {
            name,
            stake: typedDetails.stake / UNIT_CONVERSION,
            pattern: typedDetails.pattern,
            handle: typedDetails.handle,
            stakers: typedDetails.stakers,
            scheduler: typedDetails.scheduler 
          };
        });
        setProposals(proposalsData);
      } catch (error) {
        console.error("There was an error fetching proposals: ", error);
      }
    };
    fetchProposals();
  }, []);

  useEffect(() => {
    fetchAddress();
  }, []);

  return (
    <div>
      {/* ABOVE FOLD - SWAP AND GENERAL INFO */}
      <div className="card-container">
        <div className="card">
          <div className="grid-balance">
            <div className="border-right">
              <p className="text-lg text-center">
                CRED: <span className="text-bold">{credBalance}</span>
              </p>
            </div>
            <div>
              <p className="text-lg text-center">
                GARD: <span className="text-bold">{gardBalance}</span>
              </p>
            </div>
          </div>
          <div className="flex-center">
            <input
              type="text"
              name="swap"
              placeholder="Enter value"
              value={credValue}
              onChange={handleInputChange}
              className="input-field"
            />
            <button onClick={swap} className="button swap-button">
              Swap
            </button>
          </div>
          <p className="text-center text-sm text-gray mt-2 mb-10">
            This will swap CRED for GARD.
          </p>
          <hr />
          <p className="text-lg my-4">
            GARD is a token on the{" "}
            <a
              href="https://ao.arweave.dev/#/spec"
              target="_blank"
              rel="noopener noreferrer"
              className="text-bold underline"
            >
              <code>AO</code> testnet
            </a>
           ,exemplifying the powerful simplicity of a unified computing environment. It highlights how seamlessly integrated systems can enhance functionality and efficiency, offering users a robust and streamlined experience.
          </p>
          <p className="text-lg my-4">
            CRED is the token used to reward{" "}
            <a
              href="https://cookbook_ao.g8way.io/tutorials/begin/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-bold underline"
            >
              early contributors who fulfill the quests
            </a>{" "}
            on <code>AO</code>. You can get GARD by exchanging your CRED for it
            on this page.
          </p>
          <p className="text-lg my-4">
            You will get <span className="text-bold">1 GARD for the 1st CRED</span> you
            send. It then decays linearly, until you get{" "}
            <span className="text-bold">0 GARD for the 10,000th CRED</span> you
            send.
          </p>
          <p className="text-lg my-4">
            This is to incentivise a diverse set of early contributors and keep
            power well distributed, rather than granting too much power to early
            contributors who earn the most CRED.
          </p>
          <p className="text-lg my-4">
            GARD holders use GARD to vote on new code (called "Handlers") to be
            added to the GARD process. The 5 proposed handlers with the most
            GARD staked on them at any given time become active.
          </p>
          <p className="my-8 text-center">
            <a
              className="code-link"
              href="https://github.com/B0DH1i"
              target="_blank"
              rel="noopener noreferrer"
            >
              Review the code
            </a>
          </p>
        </div>
      </div>

      {/* BELOW FOLD - PROPOSALS */}
      <div className="card-container">
        <div className="proposal-container">
          <p className="header">Proposals</p>
          <div className="relative rounded-xl overflow-auto">
            <div className="shadow-sm overflow-hidden my-8">
              <div className="table border-collapse table-auto w-full text-sm">
                <div className="table-header-group">
                  <div className="table-row">
                    <div className="table-cell border-b font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left">
                      Name
                    </div>
                    <div className="table-cell border-b font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left">
                      Stake
                    </div>
                    <div className="table-cell border-b font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left">
                      Stakers
                    </div>
                    <div className="table-cell border-b font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left">
                      Handle
                    </div>
                    <div className="table-cell border-b font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left">
                      Pattern
                    </div>
                    <div className="table-cell border-b font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left">
                      Scheduler
                    </div> {}
                  </div>
                </div>
                <div className="table-body bg-white dark:bg-slate-800">
                  {proposals.map((proposal) => (
                    <div key={proposal.name} className="table-row">
                      <div className="table-cell border-b border-slate-100 p-4 pl-8 text-slate-500 dark:text-slate-400">
                        {proposal.name}
                      </div>
                      <div className="table-cell border-b border-slate-100 p-4 pl-8 text-slate-500 dark:text-slate-400">
                        {proposal.stake}
                      </div>
                      <div className="table-cell border-b border-slate-100 p-4 pl-8 text-slate-500 dark:text-slate-400">
                        {Object.entries(proposal.stakers).map(([key, value]) => (
                          <span key={key}>{`${key.substring(0, 5)}: ${value / UNIT_CONVERSION}`}</span>
                        ))}
                      </div>
                      <div className="table-cell border-b border-slate-100 p-4 pl-8 text-slate-500 dark:text-slate-400">
                        {proposal.handle}
                      </div>
                      <div className="table-cell border-b border-slate-100 p-4 pl-8 text-slate-500 dark:text-slate-400">
                        {proposal.pattern}
                      </div>
                      <div className="table-cell border-b border-slate-100 p-4 pl-8 text-slate-500 dark:text-slate-400">
                        {proposal.scheduler} {}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <p className="header">Stake</p>
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0 items-center justify-center mt-8">
            <input
              type="text"
              name="stakeName"
              placeholder="Name of proposal"
              value={stakeName}
              onChange={handleInputChange}
              className="input-field"
            />
            <input
              type="text"
              name="stakeValue"
              placeholder="Value to stake"
              value={stakeValue}
              onChange={handleInputChange}
              className="input-field"
            />
            <button onClick={stake} className="button stake-button">
              Stake
            </button>
          </div>
          <p className="text-center text-sm text-gray mt-2 mb-10">
            This will stake GARD on your chosen proposal.
          </p>
        </div>
        <div className="make-proposal-container">
          <p className="header">Make Your Own Proposal</p>
          <div className="flex flex-col space-y-4 flex-row space-x-2 mt-8">
            <input
              type="text"
              name="propName"
              placeholder="Name of proposal"
              value={propName}
              onChange={handleInputChange}
              className="input-field"
            />
            <textarea
              name="propPattern"
              placeholder="The pattern to match for your code to be executed"
              value={propPattern}
              onChange={handleTextAreaChange}
              className="text-area"
            />
            <textarea
              name="propHandle"
              placeholder="The code to be executed once a pattern is recognised"
              value={propHandle}
              onChange={handleTextAreaChange}
              className="text-area"
            />
            <input
              type="text"
              name="propScheduler"
              placeholder="Scheduler"
              value={propScheduler}
              onChange={handleInputChange}
              className="input-field"
            /> {}
            <button onClick={propose} className="button proposal-button">
              Propose
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MemeContent;
