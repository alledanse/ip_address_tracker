export async function getAddress(ip = '8.8.8.8') {
  const responseFetch = await fetch(
    `https://geo.ipify.org/api/v2/country,city?apiKey=at_rDc1Z96ETRb9ajDVtJcx8knr98zYw&ipAddress=${ip}`,
  );
  return await responseFetch.json();
}
