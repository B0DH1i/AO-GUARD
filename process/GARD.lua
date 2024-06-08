local bint = require('.bint')(256)
local ao = require('ao')
local json = require('json')

-- Initialize State
if not Balances then Balances = { [ao.id] = tostring(bint(10000 * 1e12)) } end

if Name ~= 'AO-GARD' then Name = 'AO-GARD' end

if Ticker ~= 'GARD' then Ticker = 'GARD' end

if Denomination ~= 12 then Denomination = 12 end

if not Logo then Logo = 'r0THy0vN0VqEhdg8sZNBVPfu30wBwgUefdGOTsQ0SaY' end

-- Initialize Proposals and ActiveHandlers
Proposals = Proposals or {}
ActiveHandlers = ActiveHandlers or {}
Handlers.list = Handlers.list or {}

-- Function to load handlers
function loadHandlers()
    -- Remove old handlers first
    for _, name in ipairs(ActiveHandlers) do
        local idx = findIndexByProp(Handlers.list, "name", name)
        table.remove(Handlers.list, idx)
    end
    ActiveHandlers = {}

    -- Sort the Proposals table by amount staked
    local sortableProposals = {}
    for name, details in pairs(Proposals) do
        table.insert(sortableProposals, {name = name, stake = details.stake, stakers = details.stakers, pattern = details.pattern, handle = details.handle})
    end
    table.sort(sortableProposals, function(a, b) return a.stake > b.stake end)

    local loadedCount = 0
    for _, proposal in ipairs(sortableProposals) do
        if loadedCount >= 5 then break end -- Stop after loading 5 proposals

        -- Check if the proposal has more than 10 GARD staked
        if proposal.stake > 1000 then
            assert(type(proposal.name) == 'string' and type(proposal.pattern) == 'function' and  type(proposal.handle) == 'function', 'invalid arguments: handler.add(name : string, pattern : function(msg: Message) : {-1 = break, 0 = skip, 1 = continue}, handle(msg : Message) : void)')
            assert(type(proposal.name) == 'string', 'name MUST be string')
            assert(type(proposal.pattern) == 'function', 'pattern MUST be function')
            assert(type(proposal.handle) == 'function', 'handle MUST be function')
            table.insert(Handlers.list, { pattern = proposal.pattern, handle = proposal.handle, name = proposal.name })
            ActiveHandlers[proposal.name] = {
                pattern = proposal.pattern,
                handle = proposal.handle,
                stake = proposal.stake,
                stakers = proposal.stakers
            }
            loadedCount = loadedCount + 1
        end
    end
end

-- Used to delete the active handlers when loading
function findIndexByProp(array, prop, value)
    for index, object in ipairs(array) do
      if object[prop] == value then
        return index
      end
    end
    return nil
end

-- Convert table to JSON
function tableToJson(tbl)
    local result = {}
    for key, value in pairs(tbl) do
        local valueType = type(value)
        if valueType == "table" then
            value = tableToJson(value)
            table.insert(result, string.format('"%s":%s', key, value))
        elseif valueType == "string" then
            table.insert(result, string.format('"%s":"%s"', key, value))
        elseif valueType == "number" then
            table.insert(result, string.format('"%s":%d', key, value))
        elseif valueType == "function" then
            table.insert(result, string.format('"%s":"%s"', key, tostring(value)))
        end
    end

    local json = "{" .. table.concat(result, ",") .. "}"
    return json
end

-- Proposal handler
Handlers.add(
    "propose",
    Handlers.utils.hasMatchingTag("Action", "Propose"),
    function(m)
        if m.Tags.Name and m.Tags.Pattern and m.Tags.Handle then
            local name = m.Tags.Name
            if Proposals[name] then
                local counter = 1
                while Proposals[name .. "_" .. tostring(counter)] do
                    counter = counter + 1
                end
                name = name .. "_" .. tostring(counter)
            end

            local patternFunc, patternErr = load(m.Tags.Pattern, "aoGard", "t", _G)
            if patternErr then
                print("Failed to load pattern.")
                return
            end
            local handleFunc, handleErr = load(m.Tags.Handle, "aoGard", "t", _G)
            if handleErr then
                print("Failed to load handle.")
                return
            end

            Proposals[name] = {
                stake = 0,
                pattern = patternFunc,
                handle = handleFunc,
                stakers = {}
            }
            ao.send({ Target = m.From, Data= "Proposal for " .. name .. " added." })
        else
            ao.send({ Target = m.From, Data= "Invalid proposal submitted." })
        end
    end
)

-- Stake handler
Handlers.add(
    "stake",
    Handlers.utils.hasMatchingTag("Action", "Stake"),
    function(m)
        assert(type(m.Tags.Quantity) == 'string', 'Please specify how much you are staking')
        assert(type(m.Tags.Name) == 'string', 'Please name the proposal you are staking on')
        if not Balances[m.From] then Balances[m.From] = 0 end
        if not Proposals[m.Tags.Name] then
            ao.send({ Target = m.From, Data = "That proposal does not exist"})
            return
        end
        local qty = tonumber(m.Tags.Quantity)
        assert(type(qty) == 'number', 'Quantity Tag must be a number')
        if Balances[m.From] >= qty then
            Balances[m.From] = Balances[m.From] - qty
            Proposals[m.Tags.Name].stakers[m.From] = (Proposals[m.Tags.Name].stakers[m.From] or 0) + qty
            Proposals[m.Tags.Name].stake = Proposals[m.Tags.Name].stake + qty
            ao.send({ Target = m.From, Data = "Your stake has been added to the " .. m.Tags.Name .. " proposal. Your GARD balance is now: "  .. Balances[m.From] })
            loadHandlers()
        else
            ao.send({
              Target = m.From,
              Tags = { Action = 'Transfer-Error', ['Message-Id'] = m.Id, Error = 'Insufficient Balance!' }
            })
        end
    end
)

-- Unstake handler
Handlers.add(
    "unstake",
    Handlers.utils.hasMatchingTag("Action", "Unstake"),
    function(m)
        assert(type(m.Tags.Quantity) == 'string', 'Please specify how much you are unstaking')
        assert(type(m.Tags.Name) == 'string', 'Please name the proposal you are unstaking from')
        local qty = tonumber(m.Tags.Quantity)
        assert(type(qty) == 'number', 'Quantity Tag must be a number')
        if Proposals[m.Tags.Name].stakers[m.From] >= qty then
            Balances[m.From] = Balances[m.From] + qty
            Proposals[m.Tags.Name].stakers[m.From] = Proposals[m.Tags.Name].stakers[m.From] - qty
            Proposals[m.Tags.Name].stake = Proposals[m.Tags.Name].stake - qty
            ao.send({ Target = m.From, Data = "Your stake has been removed from the " .. m.Tags.Name .. " proposal. Your GARD balance is now: " .. Balances[m.From] })
        else
            ao.send({ Target = m.From, Data = "You do not have the quantity of GARD staked on this proposal you have attempted to unstake." })
        end
    end
)

-- Proposals handler
Handlers.add(
    "proposals",
    Handlers.utils.hasMatchingTag("Action", "Proposals"),
    function(m)
        ao.send({ Target = m.From, Data = tableToJson(Proposals) })
    end
)

-- Current active handlers
Handlers.add(
    "current",
    Handlers.utils.hasMatchingTag("Action", "Current"),
    function(m)
        ao.send({ Target = m.From, Data = tableToJson(ActiveHandlers) })
    end
)

-- Info handler
Handlers.add('info', Handlers.utils.hasMatchingTag('Action', 'Info'), function(msg)
  ao.send({
    Target = msg.From,
    Name = Name,
    Ticker = Ticker,
    Logo = Logo,
    Denomination = tostring(Denomination)
  })
end)

-- Balance handler
Handlers.add('balance', Handlers.utils.hasMatchingTag('Action', 'Balance'), function(msg)
  local bal = '0'

  if (msg.Tags.Recipient and Balances[msg.Tags.Recipient]) then
    bal = Balances[msg.Tags.Recipient]
  elseif Balances[msg.From]) then
    bal = Balances[msg.From]
  end

  ao.send({
    Target = msg.From,
    Balance = bal,
    Ticker = Ticker,
    Account = msg.Tags.Recipient or msg.From,
    Data = bal
  })
end)

-- Balances handler
Handlers.add('balances', Handlers.utils.hasMatchingTag('Action', 'Balances'),
  function(msg) ao.send({ Target = msg.From, Data = json.encode(Balances) }) end)

-- Transfer handler
Handlers.add('transfer', Handlers.utils.hasMatchingTag('Action', 'Transfer'), function(msg)
  assert(type(msg.Recipient) == 'string', 'Recipient is required!')
  assert(type(msg.Quantity) == 'string', 'Quantity is required!')
  assert(bint.__lt(0, bint(msg.Quantity)), 'Quantity must be greater than 0')

  if not Balances[msg.From] then Balances[msg.From] = "0" end
  if not Balances[msg.Recipient] then Balances[msg.Recipient] = "0" end

  local qty = bint(msg.Quantity)
  local balance = bint(Balances[msg.From])
  if bint.__le(qty, balance) then
    Balances[msg.From] = tostring(bint.__sub(balance, qty))
    Balances[msg.Recipient] = tostring(bint.__add(Balances[msg.Recipient], qty))

    if not msg.Cast then
      ao.send({
        Target = msg.From,
        Action = 'Debit-Notice',
        Recipient = msg.Recipient,
        Quantity = tostring(qty),
        Data = "You transferred " .. msg.Quantity .. " to " .. msg.Recipient
      })
      ao.send({
        Target = msg.Recipient,
        Action = 'Credit-Notice',
        Sender = msg.From,
        Quantity = tostring(qty),
        Data = "You received " .. msg.Quantity .. " from " .. msg.From
      })
    end
  else
    ao.send({
      Target = msg.From,
      Action = 'Transfer-Error',
      ['Message-Id'] = msg.Id,
      Error = 'Insufficient Balance!'
    })
  end
end)

-- Mint handler
Handlers.add('mint', Handlers.utils.hasMatchingTag('Action', 'Mint'), function(msg)
  assert(type(msg.Quantity) == 'string', 'Quantity is required!')
  assert(bint.__lt(0, bint(msg.Quantity)), 'Quantity must be greater than zero!')

  if not Balances[ao.id] then Balances[ao.id] = "0" end

  if msg.From == ao.id then
    Balances[msg.From] = tostring(bint.__add(Balances[msg.From], bint(msg.Quantity)))
    ao.send({
      Target = msg.From,
      Data = "Successfully minted " .. msg.Quantity
    })
  else
    ao.send({
      Target = msg.From,
      Action = 'Mint-Error',
      ['Message-Id'] = msg.Id,
      Error = 'Only the Process Id can mint new ' .. Ticker .. ' tokens!'
    })
  end
end)

-- Refund handler
Handlers.prepend('getcred', Handlers.utils.hasMatchingTag('Action', 'GetCred'), function(m)
  assert(type(m.Quantity) == 'string', 'Quantity is required!')
  assert(bint.__lt(0, bint(m.Quantity)), 'Quantity must be greater than 0')

  if not Balances[m.From] then Balances[m.From] = "0" end

  local qty = bint(m.Quantity)
  local balance = bint(Balances[m.From])

  if Stakers[m.From] then
      local amount = bint(Stakers[m.From].amount)
      if bint.__le(balance, qty) then
          ao.send({Target = m.From, Data = 'Insufficient Balance'})
      elseif bint.__le(amount, qty) then
          local after = bint.__sub(qty, amount)
          Balances[m.From] = tostring(bint.__sub(balance, after))
          Stakers[m.From] = nil
          ao.send({Target = BuyToken, Action = 'Transfer', Recipient = m.From, Quantity = m.Quantity})
      else
          Stakers[m.From].amount = tostring(bint.__sub(amount, qty))
          ao.send({Target = BuyToken, Action = 'Transfer', Recipient = m.From, Quantity = m.Quantity})
      end
  else
      if bint.__le(qty, balance) then
          Balances[m.From] = tostring(bint.__sub(balance, qty))
          ao.send({Target = BuyToken, Action = 'Transfer', Recipient = m.From, Quantity = m.Quantity})
      else
          ao.send({Target = m.From, Data = 'Insufficient Balance'})
      end
  end
end)

-- Vote handlers
Votes = Votes or {}
VoteLength = 30 * 24

-- GetVotes
Handlers.prepend("Get-Votes", function (m) 
  return m.Action == "Get-Votes"
end, function (m)
  ao.send({
    Target = m.From,
    Data = json.encode(
      Utils.map(function (k) return { tx = k, yay = Votes[k].yay, nay = Votes[k].nay, deadline = Votes[k].deadline} end,
       Utils.keys(Votes))
    ) 
  }) 
  print("Sent Votes to caller")
end
)

-- GetInfo
Handlers.prepend("Get-Info", function (m) return m.Action == "Get-Info" end, function (m)
  ao.send({
    Target = m.From,
    Data = Man()
  })
  print('Send Info to ' .. m.From)
end)

-- GetStakers
Handlers.prepend("Get-Stakers", function (m) return m.Action == "Get-Stakers" end, function (m)
  ao.send({
    Target = m.From,
    Data = json.encode(Stakers)
  })
  print('Send Stakers to ' .. m.From)
end)

-- MINT
Handlers.prepend(
  "Mint",
  function(m)
    return m.Action == "Credit-Notice" and m.From == BuyToken
  end,
  function(m)
    local requestedAmount = tonumber(m.Quantity)
    local actualAmount = requestedAmount
    if (Minted + requestedAmount) > MaxMint then
      actualAmount = (Minted + requestedAmount) - MaxMint
      refund(m.Sender, requestedAmount - actualAmount)
    end
    assert(type(Balances) == "table", "Balances not found!")
    local prevBalance = tonumber(Balances[m.Sender]) or 0
    Balances[m.Sender] = tostring(math.floor(prevBalance + actualAmount))
    print("Minted " .. tostring(actualAmount) .. " to " .. m.Sender)
    ao.send({Target = m.Sender, Data = "Successfully Minted " .. actualAmount})
  end
)

-- GET-FRAME
Handlers.prepend(
  "Get-Frame",
  Handlers.utils.hasMatchingTag("Action", "Get-Frame"),
  function(m)
    ao.send({
      Target = m.From,
      Action = "Frame-Response",
      Data = FrameID
    })
    print("Sent FrameID: " .. FrameID)
  end
)

local function continue(fn) 
  return function (msg) 
    local result = fn(msg)
    if result == -1 then 
      return "continue"
    end
    return result
  end
end

-- Vote for Frame or Command
Handlers.prepend("vote", 
  continue(Handlers.utils.hasMatchingTag("Action", "Vote")),
  function (m)
    assert(type(Stakers) == "table", "Stakers is not in process, please load blueprint")
    assert(type(Stakers[m.From]) == "table", "Is not staker")
    assert(m.Side and (m.Side == 'yay' or m.Side == 'nay'), 'Vote yay or nay is required!')

    local quantity = tonumber(Stakers[m.From].amount)
    local id = m.TXID
    local command = m.Command or ""
    
    assert(quantity > 0, "No Staked Tokens to vote")
    if not Votes[id] then
      local deadline = tonumber(m['Block-Height']) + VoteLength
      Votes[id] = { yay = 0, nay = 0, deadline = deadline, command = command }
    end
    if Votes[id].deadline > tonumber(m['Block-Height']) then
      Votes[id][m.Side] = Votes[id][m.Side] + quantity
      print("Voted " .. m.Side .. " for " .. id)
      ao.send({Target = m.From, Data = "Voted"})
    else 
      ao.send({Target = m.From, Data = "Expired"})
    end
  end
)

-- Finalization Handler
Handlers.after("vote").add("VoteFinalize",
function (msg) 
  return "continue"
end,
function(msg)
  local currentHeight = tonumber(msg['Block-Height'])
  
  for id, voteInfo in pairs(Votes) do
      if currentHeight >= voteInfo.deadline then
          if voteInfo.yay > voteInfo.nay then
              if not voteInfo.command then
                FrameID = id
              else
                local func, err = load(voteInfo.command, Name, 't', _G)
                if not err then
                  func()
                else 
                  error(err)
                end
              end
          end
          announce(string.format("Vote %s Complete", id), Utils.keys(Stakers))
          Votes[id] = nil
      end
  end
end
)
