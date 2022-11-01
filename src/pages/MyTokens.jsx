import 'bootstrap/dist/css/bootstrap.min.css';
import CommonSection from "../components/ui/Common-section/CommonSection";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { marketplace_contract } from '../near/config2.js';
import { useEffect, useState } from 'react';
import React from "react";
import "../styles/MyTokens.css";
import {clearContentBody, provokeLogin, checkAccount, checkStandard} from "../near/utils.js";

const GAS_FEE= `100000000000000`;
const NEAR_IN_YOCTO=1000000000000000000000000;

function Mytokens() {
  const [isNft, setIsNft] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0)
  }, []);

  const handleSubmit = event => {
    event.preventDefault();

    const address = event.target.address.value;
    if (address === marketplace_contract ) {
      console.log("got");
      setIsNft(true);
      event.target.reset();
    }
    else {
      setIsNft(false);
      alert("Wrong contract address entered!")
    }

  }

  async function createDOM(contract, current=1){

    let content=document.getElementById("content");
    let footer=document.getElementById("footer");
  
    clearContentBody()
  
    let container=document.createElement("div")
    container.id="tokens_tab"
    container.classList.add('page_style')
    container.innerHTML=`<h1>Tokens</h1>`
    container.append(await tokensDOM(contract, (current-1)*9 ))
    // pagination.createDOM(contract, container, current)
  
    content.insertBefore(container, footer)
  }  

  async function tokensDOM(contract, index){
    let container=document.createElement('div');
    container.id="items"
    container.classList.add('tokens');
    
    //Shows a maximum of 20 tokens. Note this
    let result= await contract.nft_tokens_for_owner({account_id:window.accountId, from_index:index.toString() ,limit:9});
  
    const contract_metadata = await contract.nft_metadata();
    const base_uri = contract_metadata.base_uri;
  
    if(result.length === 0){
      container.textContent = "No tokens found";
    }
    else{
      for (let i=0; i<result.length; i++)
        container.append(tokenFromObject(result[i], contract, base_uri));
    }
  
    return container
  }

  function tokenFromObject(tokenObject, contract, base_uri){
    let token=document.createElement('div')
    token.id = 'tokenContainer';
    token.classList.add('token_tab_items_bg');
  
    // Finding media 
    let media = tokenObject.metadata.media;
  
    if(base_uri){
      media = base_uri + '/' + tokenObject.metadata.media;
    }
  
    token.innerHTML=`<img class ="loading" src="src/assets/images/img_loading.gif">
            <img class="cursor hidden token_image " src=${media} alt='NFT' >
            <div class='item_owner'>${tokenObject.metadata.title}</div>`
  
    let [loading_img, img] = token.querySelectorAll("img")
  
    img.addEventListener('load', ()=>{
      loading_img.style.display='none';
      img.style.display = 'block'
    });
  
    img.addEventListener('error', ()=>{
      loading_img.style.display='none';
      img.src = "src/assets/images/failed-to-load.svg"
    });
  
    img.token=tokenObject
    img.contract=contract
    img.media = media
    img.addEventListener('click', tokenModalOpen)
  
    return token;
  }

  async function tokenModalOpen(e){

    let contract = e.target.contract;
  
    let {container,modal}= createModal("token_info");
    let body=document.body;
    body.append(container);
    body.classList.add('modal-open');
  
    let media=e.target.media
    let title=e.target.token.metadata.title
    let description=e.target.token.metadata.description
    let tokenId=e.target.token.token_id
  
    let hasOwnerListedValue=await hasOwnerListed(e.target.token, contract.contractId);
  
    modal.innerHTML=`<img src=${media} height="200px">
            <div style="display:flex; flex-direction:column; gap:15px">
                      <div class="token_static_info">
                        <div class='token_main_text'>Title</div>
                        <div class='token_subtext'>${title}</div>
                      </div>
                      <div class="token_static_info">
                        <div class='token_main_text'>Description</div>
                        <div class='token_subtext'>${description}</div>
                      </div>
                      <div id="approval_section">
                        <div class='token_main_text'>List as sale</div>
                        <input id="token_sale_price" type="number" placeholder="Sale Price">
                        <button id="submit_for_sale"> Submit </button>
                      </div>
                      <div id="auction_section">
                        <div class='token_main_text'>List as auction</div>
                        <div class='token_subtext'>(Please make sure to approve the transaction before the desired start time)</div>
                        <form id='auction_form'>
                          <input id="token_auction_price" type="number" placeholder="Starting Price" step=0.01 required min=0.01><br>
                          <label class="token_subtext">Start Time:</label>
                          <input id="token_auction_start_time" type="datetime-local" required><br>
                          <label class="token_subtext">End Time:</label>
                  <input id="token_auction_end_time" type="datetime-local" required>
                  <button id="submit_for_auction" type="submit">Submit</button>
                </form>
              </div>
              <div id="remove_section" style="display:none; gap:10px;">
                <div class='token_main_text'>Remove Sale/Auction</div>
                <button id="remove_sale">Submit</button>
              </div>
                      <button id="close_modal">Close</button>
                    </div>`
  
    if (hasOwnerListedValue){
      modal.querySelector("#approval_section").style.display="none";
      modal.querySelector("#auction_section").style.display="none";
      modal.querySelector("#remove_section").style.display="flex";
    }
    
  
    modal.querySelector("#submit_for_sale").addEventListener("click", async(e)=>{
  
        const sale_price=parseFloat(document.getElementById("token_sale_price").value);
        console.log(window.marketplace_contract.accountId)
      if (!sale_price){
        alert("Please fill the fields appropriately.");
        return;
      }
  
      if(typeof(sale_price)!="number"){
        alert("Sale must be a number")
        return;
      }
  
      if(await checkStorage()){
        return;
      }
  
      const price=(sale_price*NEAR_IN_YOCTO).toLocaleString('fullwide', {useGrouping:false});
      const is_auction=false;
      
      try {
        await contract.nft_approve({"token_id": tokenId,
                                        "account_id":window.marketplace_contract.contractId,   
                                        "msg":JSON.stringify({price,is_auction})},
                                      GAS_FEE,
                                      (NEAR_IN_YOCTO/10).toLocaleString('fullwide', {useGrouping:false}) ) ;
      } catch (e) {
        alert(
          'Something went wrong! ' +
          'Maybe you need to sign out and back in? ' +
          'Check your browser console for more info.'
        )
        throw e
      }
    })
  
    let formElement=modal.querySelector("#auction_form")
    formElement.token=e.target.token
    formElement.contract=contract
    formElement.addEventListener('submit', add_auction);
  
    let removeButton=modal.querySelector("#remove_sale");
    removeButton.token=e.target.token
    removeButton.contract = contract;
    removeButton.addEventListener('click', removeSale);
  
    modal.querySelector("#close_modal").addEventListener("click", ()=>{
        body.classList.remove('modal-open')
        container.remove();
      })
  
  }
  async function add_auction(e){
    e.preventDefault()
  
    let contract = e.target.contract;
  
    if(await checkStorage()){
      return;
    }
      
    let start_time=document.getElementById('token_auction_start_time').value;
    start_time=(new Date(start_time)).getTime();
  
    let end_time=document.getElementById('token_auction_end_time').value;
    end_time=(new Date(end_time)).getTime();
  
    // Validation
    let current_time=(new Date()).getTime();
    let limit = 0; 							//TODO: Add limit between start time and end time
    if(start_time < current_time){
      alert('Start time should be greater than current time')
      return;
    }
    if(end_time < current_time){
      alert('End time should be greater than current time')
      return;	
    }
    if(end_time < start_time + limit){
      alert('End time should be greater than start time')
      return;
    }
  
    start_time*=10**6
    start_time=start_time.toString()
    end_time*=10**6
    end_time=end_time.toString()
  
    const sale_price=parseFloat(document.getElementById("token_auction_price").value);
    const price=(sale_price*NEAR_IN_YOCTO).toLocaleString('fullwide', {useGrouping:false});
  
    const is_auction=true;
  
    try{
      await contract.nft_approve({"token_id": e.target.token.token_id,
                                    "account_id":window.marketplace_contract.contractId,   
                                    "msg":JSON.stringify({price,is_auction,start_time,end_time})},
                                  GAS_FEE,
                                  (NEAR_IN_YOCTO/10).toLocaleString('fullwide', {useGrouping:false}) );	
    }	
    catch(e){
      alert(
        'Something went wrong! ' +
        'Maybe you need to sign out and back in? ' +
        'Check your browser console for more info.'
      )
      throw e
    }
  }
  
  async function removeSale(e){
  
    let contract = e.target.contract;
    try{
      await window.marketplace_contract.remove_sale({"nft_contract_id": contract.contractId, 
                              "token_id": e.target.token.token_id},
                              "200000000000000",
                              "1");
    }
    catch(e){
      alert(
        'Something went wrong! ' +
        'Maybe you need to sign out and back in? ' +
        'Check your browser console for more info.'
      )
      throw e
    }
  }
  
  async function hasOwnerListed(token, contractId) {
    try{
      let result= await window.marketplace_contract.get_sales_by_nft_contract_id({"nft_contract_id":contractId, "limit":1000})
  
      //For now this search will do, gotta update to binary search if it gets popular with a lot of nfts for an account
      for(let i=0;i<result.length;i++){
        if (result[i].token_id===token.token_id){
          return true;
        }
      }
      return false;
    }
    catch(e){
      alert(
        'Something went wrong! ' +
        'Maybe you need to sign out and back in? ' +
        'Check your browser console for more info.'
      )
      throw e
    }
  }
  
  async function checkStorage(){
    try{
      let minimum_balance= await window.marketplace_contract.storage_minimum_balance()
      let current_storage= await window.marketplace_contract.storage_balance_of({"account_id":window.accountId})
      let totalSales=await window.marketplace_contract.get_supply_by_owner_id({"account_id":window.accountId})
  
  
      if(current_storage-minimum_balance*totalSales<=minimum_balance){
        alert('Not enough storage. Please visit the Storage section to get storage.')
        return true;
      }
      else{
        return false;
      }
    }
    catch(e){
      alert(
        'Something went wrong! ' +
        'Maybe you need to sign out and back in? ' +
        'Check your browser console for more info.'
      )
      throw e
    }
  }
  
  function createModal(modalId){
    let container=document.createElement("div");
    container.classList.add('modal_bg')
  
    let modal=document.createElement("div")
    modal.classList.add("modal");
    modal.id=modalId;
  
    container.appendChild(modal);
    return {container,modal}
  }
  
  async function addContract(contractId){

    let validAccount = await checkAccount(contractId);
    if(!validAccount){
      alert('Not valid account');
      return;
    }
  
    let standardContract = await checkStandard(contractId);
    if(!standardContract){
      alert('Not an nft contract OR doesn\'t follow the nft standard NEP171');
      return;	
    }
    
    try{
      await window.marketplace_contract.add_contract_for_account(	{nft_contract_id: contractId},
                                      "200000000000000",
                                      "1000000000000000000000");
    }
    catch(e){
      alert(
        'Something went wrong! ' +
        'Maybe you need to sign out and back in? ' +
        'Check your browser console for more info.'
      )
      throw e
    }
  }

  async function removeContract(contractId) {
	
    if (contractId === window.nft_contract.contractId){
      alert('Cannot remove this contract');
      return;
    }
  
    try{
      await window.marketplace_contract.remove_contract_for_account(	{nft_contract_id: contractId},
                                      "200000000000000",
                                      "1");
    }
    catch(e){
      alert(
        'Something went wrong! ' +
        'Maybe you need to sign out and back in? ' +
        'Check your browser console for more info.'
      )
      throw e
    }
  }

  return (
    <>
    <CommonSection title="Select collection for viewing your tokens" />
    <section>
    <div className='container mx-auto mt-3'>
      <h3>Add Collection</h3>
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
      {
        isNft && <div className='my-3'>
          <img src="data:image/jpeg;base64,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" alt="" />
        </div>
      }
    </div>
    </section>
    </>
  );
}

export default Mytokens;