export default event => response => {
  if (response) {
    return response;
  }

  // event.request will always have the proper mode set ('cors, 'no-cors', etc.) so we don't
  // have to hardcode 'no-cors' like we do when fetch()ing in the install handler.
  const fetchRequest = event.request.clone();
  return fetch(fetchRequest).then(function(response) {
    if (!response.ok) {
      return response;
    }

    return response;
  });
};
