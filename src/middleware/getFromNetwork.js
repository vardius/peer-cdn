export default function getFromNetwork(event) {
  return async res => {
    if (res) {
      return res;
    }

    // event.request will always have the proper mode set ('cors, 'no-cors', etc.) so we don't
    // have to hardcode 'no-cors' like we do when fetch()ing in the install handler.
    const fetchRequest = event.request.clone();
    const response = await fetch(fetchRequest);

    if (!response.ok) {
      return response;
    }

    return response;
  };
}
