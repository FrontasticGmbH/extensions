import extensions from '../';

const DynamicPageHandler = extensions['dynamic-page-handler'];

test('lists fild with defined ID', async () => {
  const response = await DynamicPageHandler(
    { method: "GET", path: "/", query: { 'path': '/cart' }, headers: new Map<string, string>() },
    {}
  );

  expect(response).toStrictEqual({
    dynamicPageType: 'frontastic-test/cart',
    dataSourcePayload: { cart: { sum: 12340 } },
    pageMatchingPayload: { cart: { sum: 12340 } },
  });
});

export { }

