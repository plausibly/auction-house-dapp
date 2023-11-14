export function getGatewayIpfs(ipfs: string) {
    const ipfsTag = "ipfs://";
    const cid = ipfs.substring(ipfs.indexOf(ipfsTag) + ipfsTag.length);
    return "https://ipfs.io/ipfs/" + cid;
  }
  
export  async function ipfsFetch(ipfs: string) {
    const gateway = getGatewayIpfs(ipfs);
  
    try {
      const res = await fetch(gateway);
      return await res.json();
    } catch (err) {
      console.error(err);
    }
  }