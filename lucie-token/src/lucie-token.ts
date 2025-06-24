import { Address } from "@graphprotocol/graph-ts"
import {
  Approval as ApprovalEvent,
  ApprovalForAll as ApprovalForAllEvent,
  BatchMetadataUpdate as BatchMetadataUpdateEvent,
  MetadataUpdate as MetadataUpdateEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  SellOfferPlaced as SellOfferPlacedEvent,
  TokenBuyed as TokenBuyedEvent,
  TokenMinted as TokenMintedEvent,
  Transfer as TransferEvent
} from "../generated/LucieToken/LucieToken"
import {
  Approval,
  ApprovalForAll,
  BatchMetadataUpdate,
  MetadataUpdate,
  OwnershipTransferred,
  SellOfferPlaced,
  TokenBuyed,
  TokenMinted,
  Transfer,
  BuyToken
} from "../generated/schema"
let ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export function handleApproval(event: ApprovalEvent): void {
  let entity = new Approval(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.owner = event.params.owner
  entity.approved = event.params.approved
  entity.tokenId = event.params.tokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleApprovalForAll(event: ApprovalForAllEvent): void {
  let entity = new ApprovalForAll(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.owner = event.params.owner
  entity.operator = event.params.operator
  entity.approved = event.params.approved

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleBatchMetadataUpdate(
  event: BatchMetadataUpdateEvent
): void {
  let entity = new BatchMetadataUpdate(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity._fromTokenId = event.params._fromTokenId
  entity._toTokenId = event.params._toTokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMetadataUpdate(event: MetadataUpdateEvent): void {
  let entity = new MetadataUpdate(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity._tokenId = event.params._tokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleSellOfferPlaced(event: SellOfferPlacedEvent): void {
  let entity = new SellOfferPlaced(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.owner = event.params.owner
  entity.tokenId = event.params.tokenId
  entity.price = event.params.price
  entity.timestamp = event.params.timestamp
  entity.tokenURI = event.params.tokenURI

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTokenBuyed(event: TokenBuyedEvent): void {
  let entity = new TokenBuyed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.from = event.params.from
  entity.to = event.params.to
  entity.tokenId = event.params.tokenId
  entity.price = event.params.price
  entity.timestamp = event.params.timestamp
  entity.tokenURI = event.params.tokenURI

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  let entityId = event.transaction.hash.toHex() + '-' + event.logIndex.toString();

  let buyNftEntity = new BuyToken(
    entityId
  )

  buyNftEntity.buyer = event.params.to;
  buyNftEntity.seller = Address.fromString(ZERO_ADDRESS);
  buyNftEntity.tokenId = event.params.tokenId;
  buyNftEntity.timestamp = event.params.timestamp;
  buyNftEntity.tokenURI = event.params.tokenURI
  buyNftEntity.price = event.params.price;
  buyNftEntity.txType = "Purchase"


  buyNftEntity.save();
}

export function handleTokenMinted(event: TokenMintedEvent): void {
  let entityId = event.transaction.hash.toHex() + '-' + event.logIndex.toString();

  let entity = new TokenMinted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.to = event.params.to
  entity.tokenId = event.params.tokenId
  entity.price = event.params.price
  entity.timestamp = event.params.timestamp
  entity.tokenURI = event.params.tokenURI

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  let buyNftEntity = new BuyToken(
    entityId
  )

  buyNftEntity.buyer = event.params.to;
  buyNftEntity.seller = Address.fromString(ZERO_ADDRESS);
  buyNftEntity.tokenId = event.params.tokenId;
  buyNftEntity.timestamp = event.params.timestamp;
  buyNftEntity.tokenURI = event.params.tokenURI;
  buyNftEntity.price = event.params.price;
  buyNftEntity.txType = "Mint"

  buyNftEntity.save();
}

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.from = event.params.from
  entity.to = event.params.to
  entity.tokenId = event.params.tokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
