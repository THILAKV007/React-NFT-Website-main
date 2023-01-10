import "bootstrap/dist/css/bootstrap.min.css";
import CommonSection from "../components/ui/Common-section/CommonSection";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { useEffect, useState, useRef } from "react";
import { initContract } from "../near/utils.js";
import React from "react";
import "../styles/MyTokens.css";
import { Contract } from "near-api-js";
import { v4 as uuidv4 } from 'uuid';
import { contracts } from '../near/config2.js';


function Mytokens(props) {
  const [isNft, setIsNft] = useState(false);
  const {signIn, signOut, wallet, accountId} = props.mainObject;
  const [nftMetadatas, setnftMetadatas] = useState([]);
  useEffect(() => {
    query();
  }, []);

  const handleSubmit = event => {
    event.preventDefault();

    const address = event.target.address.value;
    if (address === contracts ) {
      console.log("got");
      setIsNft(true);
      event.target.reset();
    }
    else {
      setIsNft(false);
      alert("If valid address entered, You can see your NFTs below!")
    }

  }

  function checkIPFSHash(hash) {
    return hash.startsWith("Qm");
  }

  async function query() {
    const jsonData = [];
    let contracts = [
      "dev-1654679960818-32346456826161",
      "dev-1654158872994-43526873072091",
      "dev-1653362742618-42287399483761",
      "dev-1652185815615-38783641891685",
      "royalties.evin.testnet",
      "dev-1646240406152-71422260461975",
    ];
    console.log(contracts);
    const helpers = await initContract();

    contracts.forEach(async (address) => {
      const nft_contract = new Contract(
        helpers.walletConnection.account(),
        address,
        {
          viewMethods: [
            "nft_metadata",
            "nft_total_supply",
            "nft_tokens_for_owner",
            "nft_token",
          ],
          changeMethods: [
            "nft_mint",
            "nft_transfer",
            "nft_approve",
            "nft_revoke",
          ],
        }
      );

      const nfts = await nft_contract.nft_tokens_for_owner({
        account_id : accountId,
        from_index: "0",
        limit: 10,
      });
      if (nfts.length > 0) {
        console.log(nfts);
        console.log(accountId);
        jsonData.push(...nfts);
        // setnftMetadatas([...nftMetadatas, ...nfts]);
      }

      setnftMetadatas([...nftMetadatas, ...jsonData]);
    });
  }

  function getImg(url) {
    if (checkIPFSHash(url)) {
      return `https://gateway.pinata.cloud/ipfs/${url}`;
    } else {
      return url
    }
  }

  return (
    <>
      <CommonSection title="Select collection for viewing your tokens" />
      <section>
    <div className='container mx-auto mt-3'>
    <h2 style={{ color: "moccasin" }}>ADD COLLECTIONS </h2>
      <form onSubmit={handleSubmit}>
        <InputGroup  className="mb-3">
          <Form.Control
            placeholder="Valid contract Id"
            aria-label="Recipient's username"
            aria-describedby="basic-addon2"
            name='address'
            required
          />
          <Button variant="success" type='submit' id="button-addon2">
            SUBMIT
          </Button>
        </InputGroup>
      </form>
    </div>
        <h2 style={{ textAlign: "center" }}>
          Found "{nftMetadatas.length}" NFTs in your wallet
        </h2>
        <div className="container mx-auto mt-3">
          {nftMetadatas.length > 0 ? (
            nftMetadatas.map((nft, key) => {
              return (
                <div className='card'
                  style={{
                    backgroundColor: "rgb(248,248,255)",
                    opacity: "0.8",
                    width: "15vw",
                    margin: "1rem",
                  }}
                >
                  <img
                    style={{ width: "95%", margin: "0.3rem" }}
                    src={getImg(nft.metadata.media)}
                    alt=""
                    key={key}
                  />
                  <h6 style={{ color: "white", wordWrap: "break-word" }}>
                    #
                    <span style={{ color: "black", margin: "0.2rem" }}>
                      ID:{nft.token_id.toUpperCase()}
                    </span>
                  </h6>
                </div>
               
              );
            })
          ) : (
            <h3 style={{ color: "white", textAlign: "center" }}>
              No NFTs found
            </h3>
          )}
        </div>
      </section>
    </>
  );
}

export default Mytokens;